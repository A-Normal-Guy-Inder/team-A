const { rules } = require("./rules");

const registerSchema = {
    body: {
        first_name: [rules.required("First name"), rules.string("First name", { min: 1, max: 50 })],
        last_name: [rules.required("Last name"), rules.string("Last name", { min: 1, max: 50 })],
        phone_number: [rules.required("Phone number"), rules.phone()],
        email_id: [rules.required("Email"), rules.email()],
        password: [rules.required("Password"), rules.password()],
    },
};

const verifyOtpSchema = {
    body: {
        email_id: [rules.required("Email"), rules.email()],
        otp: [rules.required("OTP"), rules.otp()],
    },
};

const emailOnlySchema = {
    body: {
        email_id: [rules.required("Email"), rules.email()],
    },
};

const loginSchema = {
    body: {
        email_id: [rules.required("Email"), rules.email()],
        password: [rules.required("Password"), rules.string("Password", { min: 1, max: 100 })],
    },
};

const resetPasswordSchema = {
    body: {
        email_id: [rules.required("Email"), rules.email()],
        password: [rules.required("Password"), rules.password("New password")],
    },
};

module.exports = { registerSchema, verifyOtpSchema, emailOnlySchema, loginSchema, resetPasswordSchema };
