const transporter = require("../config/email");
const env = require("../config/env");
const templates = require("./emailTemplates");

function from(label) {
    return `"${label}" <${env.mail.user}>`;
}

function maskEmail(email) {
    const [name = "", domain = ""] = String(email).split("@");
    const visible = name.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

async function send(name, to, data = {}) {
    const template = templates[name];
    if (!template) throw new Error(`Unknown email template: ${name}`);

    const { fromLabel, critical = false, failureMessage, subject, text, html } = template(data);

    try {
        const response = await transporter.sendMail({ from: from(fromLabel), to, subject, text, html });
        console.log(`[mail] ${name} sent:`, response.messageId);
    } catch (err) {
        console.error(`[mail] ${name} send failed:`, err.message);
        if (critical) throw new Error(failureMessage || `Failed to send ${name} email`);
    }
}

function sendOtpEmail(otp, email) {
    const validityMinutes = Math.round(env.otp.ttlMs / 60000);
    return send("otp", email, { otp, validityMinutes });
}

function sendWelcomeEmail(email, name) {
    return send("welcome", email, { name });
}

/* Notices to old address */
function sendEmailChangeWarning(oldEmail, newEmail) {
    return send("emailChangeWarning", oldEmail, { masked: maskEmail(newEmail) });
}

function sendEmailChangedNotice(oldEmail, newEmail) {
    return send("emailChanged", oldEmail, { masked: maskEmail(newEmail) });
}

module.exports = {
    send,
    sendOtpEmail,
    sendWelcomeEmail,
    sendEmailChangeWarning,
    sendEmailChangedNotice,
    maskEmail,
};
