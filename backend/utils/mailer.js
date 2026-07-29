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

module.exports = { sendOtpEmail, sendWelcomeEmail };
