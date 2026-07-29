const nodemailer = require("nodemailer");
const env = require("./env");

const transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: {
        user: env.mail.user,
        pass: env.mail.pass,
    },
    // Reuse a single connection for bursts of mail instead of a TLS handshake
    // per message.
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
});

module.exports = transporter;
