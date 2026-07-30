const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { sendOtpEmail } = require("./mailer");

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

async function issueOtp(user, { purpose, invalidatePassword = false, email = null } = {}) {
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    user.otp_hash = otpHash;
    user.otp_expires_at = new Date(Date.now() + env.otp.ttlMs);
    user.otp_attempts = 0;
    user.otp_last_attempt_at = null;
    user.otp_blocked_time = null;
    if (purpose) user.otp_purpose = purpose;

    if (invalidatePassword) {
        user.password_is_verified = false;
    }

    await user.save();

    await sendOtpEmail(otp, email || user.email_id);
}

// Failed attempts decay on their own instead of sticking to the account forever:
// once the user has been idle for the whole attempt window, the counter is stale
// and the next attempt starts from scratch. Mutates in memory only, so the caller
// persists it along with whatever it was already going to save.
function resetStaleAttempts(user) {
    if (!user.otp_attempts) return false;

    const lastAttemptAt = user.otp_last_attempt_at ? new Date(user.otp_last_attempt_at).getTime() : null;

    // Documents predating this field carry no activity marker, so treat them as stale.
    if (lastAttemptAt !== null && Date.now() - lastAttemptAt < env.otp.attemptWindowMs) {
        return false;
    }

    user.otp_attempts = 0;
    user.otp_last_attempt_at = null;
    return true;
}

function remainingCooldownMs(user) {
    if (!user.otp_expires_at) return 0;
    const issuedAt = new Date(user.otp_expires_at).getTime() - env.otp.ttlMs;
    const readyAt = issuedAt + env.otp.resendCooldownMs;
    return Math.max(0, readyAt - Date.now());
}

module.exports = { generateOtp, hashOtp, verifyOtp, issueOtp, resetStaleAttempts, remainingCooldownMs };
