const { rules, isMissing } = require("./rules");

const updateProfileSchema = {
    body: {
        first_name: [rules.required("First name"), rules.string("First name", { min: 1, max: 50 })],
        last_name: [rules.required("Last name"), rules.string("Last name", { min: 1, max: 50 })],
        phone_number: [rules.required("Phone number"), rules.phone()],
    },
};

const passwordOnlySchema = {
    body: {
        password: [rules.required("Password"), rules.string("Password", { min: 1, max: 100 })],
    },
};

const changeEmailSchema = {
    body: {
        newEmail: [rules.required("New email"), rules.email("New email")],
    },
};

const otpOnlySchema = {
    body: {
        otp: [rules.required("OTP"), rules.otp()],
    },
};

const differentFromCurrent = (value, payload) => {
    if (isMissing(value) || isMissing(payload.current_password)) return undefined;
    return value === payload.current_password
        ? "New password must be different from current password."
        : undefined;
};

const changePasswordSchema = {
    body: {
        current_password: [
            rules.required("Current password"),
            rules.string("Current password", { min: 1, max: 100 }),
        ],
        new_password: [rules.required("New password"), rules.password("New password"), differentFromCurrent],
    },
};

const notificationIdSchema = {
    params: {
        notificationId: [rules.required("Notification ID"), rules.objectId("Notification ID")],
    },
};

module.exports = {
    updateProfileSchema,
    passwordOnlySchema,
    changeEmailSchema,
    otpOnlySchema,
    changePasswordSchema,
    notificationIdSchema,
};
