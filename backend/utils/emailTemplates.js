const Verification_Email_Template=`
    <div class="otp-box-wrapper">
      <div style="margin:0; padding:0; background-color:#f4f6fb; font-family:Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:30px; color:#ffffff; font-size:28px; font-weight:bold;">
              HelperHub
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333333; font-size:15px; line-height:1.6;">
              
              <p style="margin:0 0 15px 0; font-size:18px; font-weight:bold;">
                Hi there,
              </p>

              <p style="margin:0 0 25px 0;">
                Here is your One Time Password (OTP).  
                Please enter this code to verify your email address.
              </p>

              <!-- OTP Block -->
              <div style="margin:25px auto; text-align:center; font-size:32px; font-weight:bold; letter-spacing:8px; color:#111827; background-color:#f3f4f6; padding:18px 0; border-radius:10px; width:70%;">
                {otp}
              </div>

              <p style="text-align:center; font-size:14px; color:#6b7280; margin:10px 0 30px 0;">
                OTP will expire in <strong>5 minutes</strong>.
              </p>

              <p style="margin:0;">
                Best Regards,<br>
                <strong>HelperHub Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e5e7eb; padding:20px; text-align:center; font-size:13px; color:#6b7280;">

              <!-- Social Icons -->
              <div style="margin-bottom:12px;">
                <a href="#" style="margin:0 8px; text-decoration:none; font-size:18px; color:#7c3aed;"></a>
                <a href="#" style="margin:0 8px; text-decoration:none; font-size:18px; color:#7c3aed;"></a>
              </div>

              <p style="margin:0 0 10px 0;">
                © 2026 HelperHub. All rights reserved.
              </p>

              <p style="margin:0;">
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Privacy Policy</a> |
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Terms of Service</a> |
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Help Center</a> |
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Unsubscribe</a>
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
      </div>
    </div>
`;

const frontendUrl = process.env.FRONTEND_URL;
const Welcome_Email_Template= `
<div style="margin:0; padding:0; background-color:#f4f6fb; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:30px; color:#ffffff; font-size:28px; font-weight:bold;">
              Welcome to HelperHub 🎉
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333333; font-size:15px; line-height:1.6;">
              
              <p style="margin:0 0 15px 0; font-size:18px; font-weight:bold;">
                Hi {name},
              </p>

              <p style="margin:0 0 20px 0;">
                We're excited to have you on board! 🎉  
                <strong>HelperHub</strong> makes it easy to post tasks, find helpers, and get things done quickly and efficiently.
              </p>

              <p style="margin:0 0 20px 0;">
                With HelperHub, you can:
              </p>

              <ul style="padding-left:20px; margin:0 0 25px 0;">
                <li>Post tasks and hire helpers instantly</li>
                <li>Browse tasks and offer your help</li>
                <li>Track task progress in real time</li>
                <li>Manage your profile and notifications</li>
              </ul>

              <!-- CTA Button -->
              <div style="text-align:center; margin:30px 0;">
                <a href="${frontendUrl}/Dashboard"
                   style="background-color:#4f46e5; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:8px; font-size:16px; font-weight:bold; display:inline-block;">
                  Get Started
                </a>
              </div>

              <p style="margin:0;">
                If you have any questions or need help, feel free to reach out to our support team anytime.
              </p>

              <p style="margin:20px 0 0 0;">
                Cheers,<br>
                <strong>HelperHub Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e5e7eb; padding:20px; text-align:center; font-size:13px; color:#6b7280;">

              <!-- Social Icons -->
              <div style="margin-bottom:12px;">
                <a href="#" style="margin:0 8px; text-decoration:none; font-size:18px; color:#7c3aed;"></a>
                <a href="#" style="margin:0 8px; text-decoration:none; font-size:18px; color:#7c3aed;"></a>
              </div>

              <p style="margin:0 0 10px 0;">
                © 2026 HelperHub. All rights reserved.
              </p>

              <p style="margin:0;">
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Privacy Policy</a> |
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Terms of Service</a> |
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Help Center</a> |
                <a href="#" style="color:#6b7280; text-decoration:none; font-size:12px;">Unsubscribe</a>
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</div>

`

module.exports = {Verification_Email_Template,Welcome_Email_Template};