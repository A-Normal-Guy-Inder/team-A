const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const env = require("../config/env");
const { sendError } = require("../utils/apiResponse");

/**
 * Raw `req.ip` is unsafe as a bucket key for IPv6: a single client is handed a
 * whole /64, so it could rotate addresses to bypass the limit. `ipKeyGenerator`
 * normalises to the assigned prefix.
 */
const ipKey = (req) => ipKeyGenerator(req.ip);

function build({ windowMs, max, message, keyGenerator }) {
    return rateLimit({
        windowMs,
        limit: max,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        // Health checks and CORS preflights should never consume quota.
        skip: (req) => req.method === "OPTIONS" || req.path === "/health",
        keyGenerator,
        handler: (req, res) => sendError(res, { status: 429, message }),
    });
}

/** Baseline protection for the whole API surface. */
const globalLimiter = build({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    message: "Too many requests. Please slow down and try again shortly.",
});

/** Credential endpoints (login / register / reset) — brute-force protection. */
const authLimiter = build({
    windowMs: env.rateLimit.authWindowMs,
    max: env.rateLimit.authMax,
    message: "Too many authentication attempts. Please try again later.",
});

/**
 * OTP issuance is both expensive (SMTP) and abusable (mail bombing), so it is
 * limited per email address when one is supplied, falling back to the IP.
 */
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

/** Authenticated writes (task/request/profile mutations), keyed per user. */
const writeLimiter = build({
    windowMs: env.rateLimit.writeWindowMs,
    max: env.rateLimit.writeMax,
    message: "You are performing actions too quickly. Please slow down.",
    keyGenerator: (req) => (req.user?._id ? `user:${req.user._id}` : `ip:${ipKey(req)}`),
});

module.exports = { globalLimiter, authLimiter, otpLimiter, writeLimiter };
