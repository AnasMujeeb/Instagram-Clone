const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendPasswordResetEmail = async ({ to, resetToken, username }) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const transporter = createTransporter();

  const mailOptions = {
    from: `"Instagram" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your Instagram password',
    text: `Hi ${username || 'there'},\n\nWe received a request to reset your password for your Instagram account. Please click the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for 10 minutes.\n\nIf you did not request a password reset, please ignore this email.\n\nThanks,\nThe Instagram Team`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 20px; }
            .container { max-width: 480px; margin: 20px auto; background-color: #000000; border: 1px solid #262626; border-radius: 12px; padding: 36px 28px; text-align: center; }
            .logo { font-size: 32px; font-weight: 700; margin-bottom: 24px; color: #ffffff; letter-spacing: -0.5px; font-family: 'Inter', sans-serif; }
            .greeting { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 12px; text-align: left; }
            .text { font-size: 14px; color: #a8a8a8; line-height: 1.5; margin-bottom: 20px; text-align: left; }
            .btn-container { margin: 28px 0; text-align: center; }
            .btn { background-color: #0095f6; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 600; border-radius: 8px; display: inline-block; }
            .btn:hover { background-color: #1877f2; }
            .link-box { font-size: 12px; color: #737373; word-break: break-all; margin-top: 20px; text-align: left; background-color: #121212; padding: 12px; border-radius: 6px; border: 1px solid #262626; }
            .footer { font-size: 12px; color: #737373; margin-top: 28px; padding-top: 16px; border-top: 1px solid #262626; text-align: center; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Instagram</div>
            <div class="greeting">Hi ${username || 'there'},</div>
            <div class="text">
              We received a request to reset your Instagram password. Click the button below to set a new password:
            </div>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
            </div>
            <div class="text">
              This link is valid for <strong>10 minutes</strong>.
            </div>
            <div class="link-box">
              If the button above does not work, copy and paste this link into your web browser:<br>
              <a href="${resetUrl}" style="color: #0095f6; text-decoration: none;">${resetUrl}</a>
            </div>
            <div class="footer">
              If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };
