const transporter = require("../config/email");
const env = require("../config/env");
const { Welcome_Email_Template, Verification_Email_Template } = require("./emailTemplates");

const OTP_VALIDITY_MINUTES = Math.round(env.otp.ttlMs / 60000);

function from(label) {
    return `"${label}" <${env.mail.user}>`;
}

async function sendOtpEmail(otp, email) {
    try {
        const response = await transporter.sendMail({
            from: from("Account Security"),
            to: email,
            subject: "Your OTP Code for Account Verification",
            text: `Your One-Time Password is ${otp}. It is valid for ${OTP_VALIDITY_MINUTES} minutes. Do not share it with anyone.`,
            html: Verification_Email_Template.replace(/{otp}/g, otp),
        });
        console.log("[mail] OTP sent:", response.messageId);
    } catch (err) {
        console.error("[mail] OTP send failed:", err.message);
        throw new Error("Failed to send OTP email");
    }
}

async function sendWelcomeEmail(email, name) {
    try {
        const response = await transporter.sendMail({
            from: from("Support Team"),
            to: email,
            subject: "Welcome — Your Account is Successfully Verified 🎉",
            text: `Welcome ${name}! Your account has been successfully created and verified.`,
            html: Welcome_Email_Template.replace(/{name}/g, name),
        });
        console.log("[mail] Welcome sent:", response.messageId);
    } catch (err) {
        console.error("[mail] Welcome send failed:", err.message);
    }
}

/* Notices to old address */
function maskEmail(email) {
    const [name = "", domain = ""] = String(email).split("@");
    const visible = name.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

function noticeHtml(heading, body) {
    return `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;
                    border:1px solid #e2e8f0;border-radius:12px;color:#0f172a">
            <h2 style="margin:0 0 12px;font-size:20px">${heading}</h2>
            <p style="margin:0 0 12px;line-height:1.6;color:#334155">${body}</p>
            <p style="margin:16px 0 0;line-height:1.6;color:#b91c1c;font-weight:600">
                If this was not you, reset your password immediately — someone else may have
                access to your account.
            </p>
        </div>
    `;
}

async function sendEmailChangeWarning(oldEmail, newEmail) {
    const masked = maskEmail(newEmail);

    try {
        await transporter.sendMail({
            from: from("Account Security"),
            to: oldEmail,
            subject: "Security alert: a change of email address was requested",
            text:
                `Someone requested to change the email address on your account to ${masked}. ` +
                `A confirmation code was sent to that address. If this was not you, reset your ` +
                `password immediately.`,
            html: noticeHtml(
                "A change of email address was requested",
                `Someone asked to move your account to <strong>${masked}</strong>, and a
                 confirmation code was sent there. The change has not happened yet.`
            ),
        });
    } catch (err) {
        console.error("[mail] Email-change warning failed:", err.message);
    }
}

async function sendEmailChangedNotice(oldEmail, newEmail) {
    const masked = maskEmail(newEmail);

    try {
        await transporter.sendMail({
            from: from("Account Security"),
            to: oldEmail,
            subject: "Your account email address was changed",
            text:
                `The email address on your account was changed to ${masked}. This address will ` +
                `no longer receive account notifications. If this was not you, reset your ` +
                `password immediately.`,
            html: noticeHtml(
                "Your account email address was changed",
                `Your account now uses <strong>${masked}</strong>. This address will no longer
                 receive account notifications.`
            ),
        });
    } catch (err) {
        console.error("[mail] Email-changed notice failed:", err.message);
    }
}

module.exports = {
    sendOtpEmail,
    sendWelcomeEmail,
    sendEmailChangeWarning,
    sendEmailChangedNotice,
    maskEmail,
};
