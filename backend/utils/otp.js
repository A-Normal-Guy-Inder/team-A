const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { sendOtpEmail } = require("./mailer");

/**
 * Cryptographically secure numeric OTP of fixed length.
 *
 * `Math.random()` is not suitable here: it is seeded predictably and an
 * attacker who observes a few codes can narrow the search space for the next
 * one. `crypto.randomInt` draws from the OS CSPRNG and is unbiased.
 */
function generateOtp(length = env.otp.length) {
    const min = 10 ** (length - 1);
    const max = 10 ** length;
    return String(crypto.randomInt(min, max));
}

async function hashOtp(otp) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(String(otp), salt);
}

function verifyOtp(otp, hash) {
    if (!hash) return Promise.resolve(false);
    return bcrypt.compare(String(otp), hash);
}

/**
 * Issues a fresh OTP for `user`, persists its hash and emails the plaintext.
 *
 * @param {object}  user            Mongoose user document.
 * @param {object}  options
 * @param {string}  options.purpose Flow this code belongs to; verification
 *   refuses codes minted for a different purpose.
 * @param {boolean} options.invalidatePassword  Set for password-reset flows so
 *   the account cannot be used until the reset completes.
 * @param {string}  options.email   Destination override (email-change flow).
 */
async function issueOtp(user, { purpose, invalidatePassword = false, email = null } = {}) {
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    user.otp_hash = otpHash;
    user.otp_expires_at = new Date(Date.now() + env.otp.ttlMs);
    user.otp_attempts = 0;
    user.otp_blocked_time = null;
    if (purpose) user.otp_purpose = purpose;

    if (invalidatePassword) {
        user.password_is_verified = false;
    }

    await user.save();

    // Sent after the hash is committed: an email that arrives without a
    // matching stored hash is unusable, whereas the reverse is merely a resend.
    await sendOtpEmail(otp, email || user.email_id);
}

/** Remaining cooldown (ms) before another OTP may be requested. */
function remainingCooldownMs(user) {
    if (!user.otp_expires_at) return 0;
    const issuedAt = new Date(user.otp_expires_at).getTime() - env.otp.ttlMs;
    const readyAt = issuedAt + env.otp.resendCooldownMs;
    return Math.max(0, readyAt - Date.now());
}

module.exports = { generateOtp, hashOtp, verifyOtp, issueOtp, remainingCooldownMs };
