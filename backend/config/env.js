const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const REQUIRED = ["MONGO_URI", "JWT_SECRET"];

function required(name, fallback) {
    const value = process.env[name];
    if (value === undefined || value === "") {
        if (fallback !== undefined) return fallback;
        return undefined;
    }
    return value;
}

function toInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value, fallback) {
    if (value === undefined || value === "") return fallback;
    return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function toList(value, fallback) {
    if (!value) return fallback;
    return String(value)
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
}

const nodeEnv = required("NODE_ENV", "development");
const isProduction = nodeEnv === "production";

const frontendUrls = toList(process.env.FRONTEND_URL, ["http://localhost:3000"]);

const env = {
    nodeEnv,
    isProduction,
    isTest: nodeEnv === "test",

    port: toInt(process.env.PORT, 5000),

    mongoUri: required("MONGO_URI"),

    jwtSecret: required("JWT_SECRET"),
    jwtShortExpiry: required("JWT_SHORT_EXPIRY", "2h"),
    jwtLongExpiry: required("JWT_LONG_EXPIRY", "30d"),

    cookieName: required("COOKIE_NAME", "hire_a_helper_token"),
    // Cross-site needs None+Secure
    cookieSecure: toBool(process.env.COOKIE_SECURE, isProduction),
    cookieSameSite: required("COOKIE_SAMESITE", isProduction ? "none" : "lax"),
    shortSessionMs: toInt(process.env.SHORT_SESSION_MS, 2 * 60 * 60 * 1000),
    longSessionMs: toInt(process.env.LONG_SESSION_MS, 30 * 24 * 60 * 60 * 1000),

    frontendUrls,

    mail: {
        host: required("SMTP_HOST", "smtp.gmail.com"),
        port: toInt(process.env.SMTP_PORT, 465),
        secure: toBool(process.env.SMTP_SECURE, true),
        user: required("GMAIL_USER", "isb.inder59433@gmail.com"),
        pass: required("GMAIL_PASS", ""),
    },

    cloudinary: {
        cloudName: required("CLOUDINARY_CLOUD_NAME", ""),
        apiKey: required("CLOUDINARY_API_KEY", ""),
        apiSecret: required("CLOUDINARY_API_SECRET", ""),
    },

    upload: {
        maxFileSizeBytes: toInt(process.env.UPLOAD_MAX_BYTES, 5 * 1024 * 1024),
        tempDir: required("UPLOAD_TEMP_DIR", path.join(__dirname, "..", "public", "temp")),
    },

    otp: {
        length: toInt(process.env.OTP_LENGTH, 6),
        ttlMs: toInt(process.env.OTP_TTL_MS, 5 * 60 * 1000),
        resendCooldownMs: toInt(process.env.OTP_RESEND_COOLDOWN_MS, 60 * 1000),
        maxAttempts: toInt(process.env.OTP_MAX_ATTEMPTS, 6),
        blockMs: toInt(process.env.OTP_BLOCK_MS, 10 * 60 * 1000),
    },

    security: {
        passwordReverifyWindowMs: toInt(process.env.PASSWORD_REVERIFY_WINDOW_MS, 10 * 60 * 1000),
        requestCooldownMs: toInt(process.env.REQUEST_COOLDOWN_MS, 24 * 60 * 60 * 1000),
    },

    rateLimit: {
        windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
        max: toInt(process.env.RATE_LIMIT_MAX, 600),
        authWindowMs: toInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
        authMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 25),
        otpWindowMs: toInt(process.env.OTP_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000),
        otpMax: toInt(process.env.OTP_RATE_LIMIT_MAX, 12),
        writeWindowMs: toInt(process.env.WRITE_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
        writeMax: toInt(process.env.WRITE_RATE_LIMIT_MAX, 120),
    },

    pagination: {
        defaultLimit: toInt(process.env.PAGINATION_DEFAULT_LIMIT, 12),
        maxLimit: toInt(process.env.PAGINATION_MAX_LIMIT, 100),
    },

    jobs: {
        ensureIndexes: toBool(process.env.ENSURE_INDEXES, true),
        enabled: toBool(process.env.CRON_ENABLED, true),
        timezone: required("CRON_TIMEZONE", "Asia/Kolkata"),
        autoCloseSchedule: required("CRON_AUTO_CLOSE_SCHEDULE", "* * * * *"),
        lockTtlMs: toInt(process.env.CRON_LOCK_TTL_MS, 55 * 1000),
    },
};

function assertConfig() {
    const missing = REQUIRED.filter((key) => !process.env[key]);
    if (missing.length) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
    if (env.isProduction && env.jwtSecret && env.jwtSecret.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters in production");
    }
}

module.exports = env;
module.exports.assertConfig = assertConfig;
