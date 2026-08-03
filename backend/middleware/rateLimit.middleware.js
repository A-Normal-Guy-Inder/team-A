const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const env = require("../config/env");
const { sendError } = require("../utils/apiResponse");

const ipKey = (req) => ipKeyGenerator(req.ip);

function build({ windowMs, max, message, keyGenerator, skipSuccessfulRequests }) {
    return rateLimit({
        windowMs,
        limit: max,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skip: (req) => req.method === "OPTIONS" || req.path === "/health",
        skipSuccessfulRequests,
        keyGenerator,
        handler: (req, res) => sendError(res, { status: 429, message }),
    });
}

const globalLimiter = build({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    message: "Too many requests. Please slow down and try again shortly.",
});

/* Only failures count */
const authLimiter = build({
    windowMs: env.rateLimit.authWindowMs,
    max: env.rateLimit.authMax,
    message: "Too many authentication attempts. Please try again later.",
    skipSuccessfulRequests: true,
});

const otpLimiter = build({
    windowMs: env.rateLimit.otpWindowMs,
    max: env.rateLimit.otpMax,
    message: "Too many OTP requests. Please wait before requesting another code.",
    keyGenerator: (req) => {
        const email = req.body?.email_id || req.body?.newEmail;
        if (typeof email === "string" && email.trim()) {
            return `otp:${email.trim().toLowerCase()}`;
        }
        return `otp-ip:${ipKey(req)}`;
    },
});

const writeLimiter = build({
    windowMs: env.rateLimit.writeWindowMs,
    max: env.rateLimit.writeMax,
    message: "You are performing actions too quickly. Please slow down.",
    keyGenerator: (req) => (req.user?._id ? `user:${req.user._id}` : `ip:${ipKey(req)}`),
});

module.exports = { globalLimiter, authLimiter, otpLimiter, writeLimiter };
