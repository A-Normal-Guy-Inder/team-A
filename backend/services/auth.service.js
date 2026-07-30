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
};

const BCRYPT_ROUNDS = 10;

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

    if (user.is_verified && user.otp_purpose === OTP_PURPOSE.ACCOUNT_VERIFICATION) {
        throw ApiError.badRequest("Email is already verified. Please login.");
    }

    const cooldown = remainingCooldownMs(user);
    if (cooldown > 0) {
        throw ApiError.tooManyRequests(
            `Please wait ${Math.ceil(cooldown / 1000)}s before requesting another OTP`
        );
    }

    await issueOtp(user, {
        purpose: user.otp_purpose || OTP_PURPOSE.ACCOUNT_VERIFICATION,
        invalidatePassword: user.otp_purpose === OTP_PURPOSE.PASSWORD_RESET,
    });

    return { message: "OTP resent successfully" };
}

async function login({ email_id, password, rememberMe }) {
    const user = await findByEmailWithSecrets(email_id);
    if (!user) throw ApiError.notFound("User not found.");

    if (!user.is_verified) {
        await resendOtp({ email_id }).catch(() => {});
        throw ApiError.badRequest("User not verified.");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw ApiError.badRequest("Invalid Password.");

    const expiresIn = rememberMe ? env.jwtLongExpiry : env.jwtShortExpiry;
    const token = jwt.sign({ userId: user._id }, env.jwtSecret, { expiresIn });

    return {
        token,
        maxAge: rememberMe ? env.longSessionMs : env.shortSessionMs,
        user: user.toPublicJSON(),
    };
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
    forgotPassword,
    resetPassword,
};
