const validator = require("validator");

/**
 * Small, dependency-light rule set. Each rule returns `undefined` when the
 * value is acceptable, or a human-readable error message when it is not.
 *
 * Rules are pure so the same definitions can be reused by any layer.
 */

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 100;
// Kept deliberately broad and identical to the client-side check so a password
// accepted by the signup form is never rejected by the API (and vice versa).
const PASSWORD_SPECIAL = /[!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~]/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

function isMissing(value) {
    return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

const rules = {
    required: (label) => (value) => (isMissing(value) ? `${label} is required` : undefined),

    string: (label, { min = 0, max = Infinity } = {}) => (value) => {
        if (isMissing(value)) return undefined;
        if (typeof value !== "string") return `${label} must be text`;
        const trimmed = value.trim();
        if (trimmed.length < min) return `${label} must be at least ${min} characters`;
        if (trimmed.length > max) return `${label} must be at most ${max} characters`;
        return undefined;
    },

    email: (label = "Email") => (value) => {
        if (isMissing(value)) return undefined;
        return validator.isEmail(String(value).trim()) ? undefined : `${label} must be a valid email address`;
    },

    phone: (label = "Phone number") => (value) => {
        if (isMissing(value)) return undefined;
        return PHONE_PATTERN.test(String(value).trim())
            ? undefined
            : `${label} must be a valid 10-digit Indian mobile number`;
    },

    password: (label = "Password") => (value) => {
        if (isMissing(value)) return undefined;
        const password = String(value);
        if (password.length < PASSWORD_MIN_LENGTH) return `${label} must be at least ${PASSWORD_MIN_LENGTH} characters`;
        if (password.length > PASSWORD_MAX_LENGTH) return `${label} must be at most ${PASSWORD_MAX_LENGTH} characters`;
        if (!/[A-Z]/.test(password)) return `${label} must contain at least one uppercase letter (A-Z)`;
        if (!/[a-z]/.test(password)) return `${label} must contain at least one lowercase letter (a-z)`;
        if (!/[0-9]/.test(password)) return `${label} must contain at least one number (0-9)`;
        if (!PASSWORD_SPECIAL.test(password)) return `${label} must contain at least one special character (!@#$%^&*)`;
        return undefined;
    },

    otp: (label = "OTP") => (value) => {
        if (isMissing(value)) return undefined;
        return /^\d{4,8}$/.test(String(value).trim()) ? undefined : `${label} must be a numeric code`;
    },

    uuid: (label) => (value) => {
        if (isMissing(value)) return undefined;
        return validator.isUUID(String(value)) ? undefined : `${label} is not a valid identifier`;
    },

    objectId: (label) => (value) => {
        if (isMissing(value)) return undefined;
        return validator.isMongoId(String(value)) ? undefined : `${label} is not a valid identifier`;
    },

    oneOf: (label, allowed) => (value) => {
        if (isMissing(value)) return undefined;
        return allowed.includes(value) ? undefined : `${label} must be one of: ${allowed.join(", ")}`;
    },

    date: (label) => (value) => {
        if (isMissing(value)) return undefined;
        return Number.isNaN(new Date(value).getTime()) ? `${label} must be a valid date` : undefined;
    },

    boolean: (label) => (value) => {
        if (isMissing(value)) return undefined;
        return [true, false, "true", "false"].includes(value) ? undefined : `${label} must be true or false`;
    },
};

module.exports = { rules, isMissing, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, PHONE_PATTERN };
