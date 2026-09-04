const env = require("../config/env");

const APP_NAME = "HelperHub";

// Resolved at send time.
const dashboardUrl = () => `${env.frontendUrls[0]}/Dashboard`;

const footer = `
          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e5e7eb; padding:20px; text-align:center; font-size:13px; color:#6b7280;">

              <!-- Social Icons -->
              <div style="margin-bottom:12px;">
                <a href="#" style="margin:0 8px; text-decoration:none; font-size:18px; color:#7c3aed;"></a>
                <a href="#" style="margin:0 8px; text-decoration:none; font-size:18px; color:#7c3aed;"></a>
              </div>

              <p style="margin:0 0 10px 0;">
                &copy; 2026 ${APP_NAME}. All rights reserved.
              </p>

              <p style="margin:0;">
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Privacy Policy</a> |
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Terms of Service</a> |
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Help Center</a> |
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Unsubscribe</a>
              </p>

            </td>
          </tr>
`;

function layout({ headerTitle = APP_NAME, body }) {
    return `
<div style="margin:0; padding:0; background-color:#f4f6fb; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:30px; color:#ffffff; font-size:28px; font-weight:bold;">
              ${headerTitle}
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333333; font-size:15px; line-height:1.6;">
${body}
            </td>
          </tr>
${footer}
        </table>

      </td>
    </tr>
  </table>

</div>
`;
}

// Shared trailer for security notices sent to a previous address.
const securityWarning = `
              <p style="margin:16px 0 0 0; line-height:1.6; color:#b91c1c; font-weight:600;">
                If this was not you, reset your password immediately &mdash; someone else may have
                access to your account.
              </p>
`;

const otp = ({ otp, validityMinutes }) => ({
    fromLabel: "Account Security",
    critical: true,
    failureMessage: "Failed to send OTP email",
    subject: "Your OTP Code for Account Verification",
    text: `Your One-Time Password is ${otp}. It is valid for ${validityMinutes} minutes. Do not share it with anyone.`,
    html: layout({
        body: `
              <p style="margin:0 0 15px 0; font-size:18px; font-weight:bold;">
                Hi there,
              </p>

              <p style="margin:0 0 25px 0;">
                Here is your One Time Password (OTP).
                Please enter this code to verify your email address.
              </p>

              <!-- OTP Block -->
              <div style="margin:25px auto; text-align:center; font-size:32px; font-weight:bold; letter-spacing:8px; color:#111827; background-color:#f3f4f6; padding:18px 0; border-radius:10px; width:70%;">
                ${otp}
              </div>

              <p style="text-align:center; font-size:14px; color:#6b7280; margin:10px 0 30px 0;">
                OTP will expire in <strong>${validityMinutes} minutes</strong>.
              </p>

              <p style="margin:0;">
                Best Regards,<br>
                <strong>${APP_NAME} Team</strong>
              </p>
`,
    }),
});

const welcome = ({ name }) => ({
    fromLabel: "Support Team",
    critical: false,
    subject: "Welcome — Your Account is Successfully Verified 🎉",
    text: `Welcome ${name}! Your account has been successfully created and verified.`,
    html: layout({
        headerTitle: `Welcome to ${APP_NAME} 🎉`,
        body: `
              <p style="margin:0 0 15px 0; font-size:18px; font-weight:bold;">
                Hi ${name},
              </p>

              <p style="margin:0 0 20px 0;">
                We're excited to have you on board!
                <strong>${APP_NAME}</strong> makes it easy to post tasks, find helpers, and get things done quickly and efficiently.
              </p>

              <p style="margin:0 0 20px 0;">
                With ${APP_NAME}, you can:
              </p>

              <ul style="padding-left:20px; margin:0 0 25px 0;">
                <li>Post tasks and hire helpers instantly</li>
                <li>Browse tasks and offer your help</li>
                <li>Track task progress in real time</li>
                <li>Manage your profile and notifications</li>
              </ul>

              <!-- CTA Button -->
              <div style="text-align:center; margin:30px 0;">
                <a href="${dashboardUrl()}"
                   style="background-color:#4f46e5; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:8px; font-size:16px; font-weight:bold; display:inline-block;">
                  Get Started
                </a>
              </div>

              <p style="margin:0;">
                If you have any questions or need help, feel free to reach out to our support team anytime.
              </p>

              <p style="margin:20px 0 0 0;">
                Cheers,<br>
                <strong>${APP_NAME} Team</strong>
              </p>
`,
    }),
});

const emailChangeWarning = ({ masked }) => ({
    fromLabel: "Account Security",
    critical: false,
    subject: "Security alert: a change of email address was requested",
    text:
        `Someone requested to change the email address on your account to ${masked}. ` +
        `A confirmation code was sent to that address. If this was not you, reset your ` +
        `password immediately.`,
    html: layout({
        headerTitle: "Security alert",
        body: `
              <p style="margin:0 0 12px 0; font-size:18px; font-weight:bold;">
                A change of email address was requested
              </p>

              <p style="margin:0; line-height:1.6;">
                Someone asked to move your account to <strong>${masked}</strong>, and a
                confirmation code was sent there. The change has not happened yet.
              </p>
${securityWarning}
`,
    }),
});

const emailChanged = ({ masked }) => ({
    fromLabel: "Account Security",
    critical: false,
    subject: "Your account email address was changed",
    text:
        `The email address on your account was changed to ${masked}. This address will ` +
        `no longer receive account notifications. If this was not you, reset your ` +
        `password immediately.`,
    html: layout({
        headerTitle: "Security alert",
        body: `
              <p style="margin:0 0 12px 0; font-size:18px; font-weight:bold;">
                Your account email address was changed
              </p>

              <p style="margin:0; line-height:1.6;">
                Your account now uses <strong>${masked}</strong>. This address will no longer
                receive account notifications.
              </p>
${securityWarning}
`,
    }),
});

module.exports = { otp, welcome, emailChangeWarning, emailChanged };
