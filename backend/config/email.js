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
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
});

module.exports = transporter;
