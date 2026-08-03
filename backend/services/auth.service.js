const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { issueOtp, verifyOtp, resetStaleAttempts, remainingCooldownMs } = require("../utils/otp");
const { sendWelcomeEmail } = require("../utils/mailer");

const OTP_PURPOSE = {
    ACCOUNT_VERIFICATION: "account_verification",
    PASSWORD_RESET: "password_reset",
    EMAIL_CHANGE: "email_change",
    TWO_FACTOR: "two_factor",
};

const BCRYPT_ROUNDS = 10;

/* Avoids account-existence oracle */
const GENERIC_LOGIN_ERROR = "Invalid email or password.";

// Burns equivalent bcrypt time
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), BCRYPT_ROUNDS);

function normaliseEmail(email) {
    return String(email || "").trim().toLowerCase();
}

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    return bcrypt.hash(password, salt);
}

function findByEmailWithSecrets(email) {
    return User.findOne({ email_id: normaliseEmail(email) }).select("+password +otp_hash");
}

async function register(payload) {
    const email = normaliseEmail(payload.email_id);
    const existing = await User.findOne({ email_id: email });

    if (existing?.is_verified) {
        throw ApiError.conflict("User already exists");
    }

    const passwordHash = await hashPassword(payload.password);

    if (existing) {
        existing.first_name = payload.first_name.trim();
        existing.last_name = payload.last_name.trim();
        existing.phone_number = payload.phone_number.trim();
        existing.email_id = email;
        existing.password = passwordHash;
        await existing.save();

        await issueOtp(existing, { purpose: OTP_PURPOSE.ACCOUNT_VERIFICATION });
        return { message: "User registered. OTP sent to email." };
    }

    const user = new User({
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        phone_number: payload.phone_number.trim(),
        email_id: email,
        password: passwordHash,
    });

    await user.save();
    await issueOtp(user, { purpose: OTP_PURPOSE.ACCOUNT_VERIFICATION });

    return { message: "User registered. OTP sent to email." };
}

async function consumeOtp(user, otp, expectedPurpose) {
    if (user.otp_blocked_time && Date.now() < new Date(user.otp_blocked_time).getTime()) {
        throw ApiError.tooManyRequests("Too many failed attempts. Try again later.");
    }

    resetStaleAttempts(user);

    if (!user.otp_hash || !user.otp_expires_at || Date.now() > new Date(user.otp_expires_at).getTime()) {
        throw ApiError.badRequest("OTP expired. Please resend OTP.");
    }

    if (expectedPurpose && user.otp_purpose && user.otp_purpose !== expectedPurpose) {
        throw ApiError.badRequest("This code cannot be used for this action. Please request a new one.");
    }

    const valid = await verifyOtp(otp, user.otp_hash);
    if (!valid) {
        user.otp_attempts = (user.otp_attempts || 0) + 1;
        user.otp_last_attempt_at = new Date();

        if (user.otp_attempts >= env.otp.maxAttempts) {
            user.otp_blocked_time = new Date(Date.now() + env.otp.blockMs);
            user.otp_hash = null;
            await user.save();
            throw ApiError.tooManyRequests(
                `Too many wrong attempts. Try again in ${Math.round(env.otp.blockMs / 60000)} minutes.`
            );
        }

        await user.save();
        throw ApiError.badRequest(`Invalid OTP. Attempts left: ${env.otp.maxAttempts - user.otp_attempts}`);
    }

    user.otp_hash = null;
    user.otp_expires_at = null;
    user.otp_purpose = null;
    user.otp_attempts = 0;
    user.otp_last_attempt_at = null;
    user.otp_blocked_time = null;

    return user;
}

async function verifyEmailOtp({ email_id, otp }) {
    const user = await findByEmailWithSecrets(email_id);
    if (!user) throw ApiError.notFound("User not found.");

    const purpose = user.otp_purpose || OTP_PURPOSE.ACCOUNT_VERIFICATION;
    await consumeOtp(user, otp, purpose);

    const wasUnverified = !user.is_verified;

    if (purpose === OTP_PURPOSE.PASSWORD_RESET) {
        user.password_reset_expires_at = new Date(Date.now() + env.security.passwordReverifyWindowMs);
        user.password_is_verified = true;
        user.password_verified_at = new Date();
    } else {
        user.is_verified = true;
        user.password_is_verified = true;
        user.password_verified_at = new Date();
    }

    await user.save();

    if (wasUnverified && purpose !== OTP_PURPOSE.PASSWORD_RESET) {
        await sendWelcomeEmail(user.email_id, `${user.first_name} ${user.last_name}`);
    }

    return { message: "Email verified successfully" };
}

async function resendOtp({ email_id }) {
    const user = await findByEmailWithSecrets(email_id);
    if (!user) throw ApiError.notFound("User not found.");

    /* Fallback must precede guards */
    const purpose = user.otp_purpose || OTP_PURPOSE.ACCOUNT_VERIFICATION;

    if (user.is_verified && purpose === OTP_PURPOSE.ACCOUNT_VERIFICATION) {
        throw ApiError.badRequest("Email is already verified. Please login.");
    }

    /* Reissue only inside window */
    if (purpose === OTP_PURPOSE.TWO_FACTOR && twoFactorPendingMs(user) === 0) {
        throw ApiError.forbidden("Verification session expired. Please log in again.");
    }

    const cooldown = remainingCooldownMs(user);
    if (cooldown > 0) {
        throw ApiError.tooManyRequests(
            `Please wait ${Math.ceil(cooldown / 1000)}s before requesting another OTP`
        );
    }

    await issueOtp(user, {
        purpose,
        invalidatePassword: purpose === OTP_PURPOSE.PASSWORD_RESET,
    });

    return { message: "OTP resent successfully" };
}

function lockoutMessage(remainingMs) {
    return `Too many failed login attempts. Please try again in ${Math.ceil(remainingMs / 60000)} minute(s).`;
}

function loginLockRemainingMs(user) {
    if (!user.login_blocked_until) return 0;
    return Math.max(0, new Date(user.login_blocked_until).getTime() - Date.now());
}

/* Decays stale counter */
function resetStaleLoginAttempts(user) {
    if (!user.login_attempts) return;

    const lastAttemptAt = user.login_last_attempt_at
        ? new Date(user.login_last_attempt_at).getTime()
        : null;

    if (lastAttemptAt !== null && Date.now() - lastAttemptAt < env.security.loginAttemptWindowMs) {
        return;
    }

    user.login_attempts = 0;
    user.login_last_attempt_at = null;
}

async function clearFailedLogins(user) {
    if (!user.login_attempts && !user.login_last_attempt_at && !user.login_blocked_until) return;

    user.login_attempts = 0;
    user.login_last_attempt_at = null;
    user.login_blocked_until = null;
    await user.save();
}

/** Always throws */
async function registerFailedLogin(user) {
    user.login_attempts = (user.login_attempts || 0) + 1;
    user.login_last_attempt_at = new Date();

    if (user.login_attempts >= env.security.loginMaxAttempts) {
        // Reset counter with block
        user.login_attempts = 0;
        user.login_blocked_until = new Date(Date.now() + env.security.loginBlockMs);
        await user.save();
        throw ApiError.tooManyRequests(lockoutMessage(env.security.loginBlockMs));
    }

    await user.save();
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
}

async function login({ email_id, password, rememberMe }) {
    const user = await findByEmailWithSecrets(email_id);

    /* Timing-equalized dummy compare */
    if (!user) {
        await bcrypt.compare(String(password), DUMMY_PASSWORD_HASH);
        throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
    }

    const lockedFor = loginLockRemainingMs(user);
    if (lockedFor > 0) throw ApiError.tooManyRequests(lockoutMessage(lockedFor));

    resetStaleLoginAttempts(user);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) await registerFailedLogin(user);

    /* Must follow password check */
    if (!user.is_verified) {
        await clearFailedLogins(user);
        await resendOtp({ email_id }).catch(() => {});
        throw ApiError.badRequest("User not verified.");
    }

    await clearFailedLogins(user);

    /* Login supersedes logout cutoff */
    if (user.sessions_valid_from) {
        user.sessions_valid_from = null;
        await user.save();
    }

    /* No token until verifyTwoFactor */
    if (user.two_factor_enabled) {
        user.two_factor_pending_until = new Date(Date.now() + env.security.twoFactorWindowMs);
        // issueOtp persists the document
        await issueOtp(user, { purpose: OTP_PURPOSE.TWO_FACTOR });

        return { twoFactorRequired: true, email: user.email_id };
    }

    return issueSession(user, rememberMe);
}

function issueSession(user, rememberMe) {
    const expiresIn = rememberMe ? env.jwtLongExpiry : env.jwtShortExpiry;
    const token = jwt.sign({ userId: user._id }, env.jwtSecret, { expiresIn });

    return {
        token,
        maxAge: rememberMe ? env.longSessionMs : env.shortSessionMs,
        user: user.toPublicJSON(),
    };
}

function twoFactorPendingMs(user) {
    if (!user.two_factor_pending_until) return 0;
    return Math.max(0, new Date(user.two_factor_pending_until).getTime() - Date.now());
}

async function verifyTwoFactor({ email_id, otp, rememberMe }) {
    const user = await findByEmailWithSecrets(email_id);

    /* Every rejection: same 403 */
    if (!user || !user.two_factor_enabled || twoFactorPendingMs(user) === 0) {
        throw ApiError.forbidden("Verification session expired. Please log in again.");
    }

    await consumeOtp(user, otp, OTP_PURPOSE.TWO_FACTOR);

    user.two_factor_pending_until = null;
    await user.save();

    return issueSession(user, rememberMe);
}

/* Retires all tokens; best-effort */
async function invalidateSessions(token) {
    if (!token) return;

    let decoded;
    try {
        decoded = jwt.verify(token, env.jwtSecret);
    } catch {
        return;
    }

    await User.updateOne({ _id: decoded.userId }, { $set: { sessions_valid_from: new Date() } });
}

async function forgotPassword({ email_id }) {
    const user = await findByEmailWithSecrets(email_id);
    if (!user) throw ApiError.notFound("User not found.");

    if (!user.is_verified) throw ApiError.badRequest("User is not verified. Password cannot be changed.");

    const cooldown = remainingCooldownMs(user);
    if (cooldown > 0 && user.otp_purpose === OTP_PURPOSE.PASSWORD_RESET) {
        throw ApiError.tooManyRequests(
            `Please wait ${Math.ceil(cooldown / 1000)}s before requesting another OTP`
        );
    }

    await issueOtp(user, { purpose: OTP_PURPOSE.PASSWORD_RESET, invalidatePassword: true });

    return { message: "OTP sent successfully." };
}

async function resetPassword({ email_id, password }) {
    const user = await findByEmailWithSecrets(email_id);
    if (!user) throw ApiError.notFound("User not found.");

    if (!user.is_verified) {
        throw ApiError.badRequest("User is not verified. Password cannot be changed.");
    }

    const grantExpiry = user.password_reset_expires_at ? new Date(user.password_reset_expires_at).getTime() : 0;
    if (!grantExpiry || Date.now() > grantExpiry) {
        throw ApiError.forbidden("Password reset session expired. Please verify your OTP again.");
    }

    const sameAsOld = await bcrypt.compare(password, user.password);
    if (sameAsOld) {
        throw ApiError.badRequest("New password must be different from your current password.");
    }

    user.password = await hashPassword(password);
    user.last_password_change = new Date();
    user.password_reset_expires_at = null;
    user.password_is_verified = true;
    user.password_verified_at = new Date();
    user.otp_hash = null;
    user.otp_expires_at = null;
    user.otp_purpose = null;

    await user.save();

    return { message: "Password reset successful." };
}

module.exports = {
    OTP_PURPOSE,
    normaliseEmail,
    hashPassword,
    consumeOtp,
    register,
    verifyEmailOtp,
    resendOtp,
    login,
    verifyTwoFactor,
    invalidateSessions,
    forgotPassword,
    resetPassword,
};
