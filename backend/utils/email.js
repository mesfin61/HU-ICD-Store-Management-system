const nodemailer = require("nodemailer");

// =========================================================
// EMAIL TRANSPORTER
// =========================================================

const emailTransporter =
  nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// =========================================================
// WELCOME EMAIL
// =========================================================

async function sendWelcomeEmail({
  recipientEmail,
  recipientName,
  roleName,
  initialPassword,
}) {
  if (!recipientEmail) {
    throw new Error(
      "RECIPIENT_EMAIL_REQUIRED",
    );
  }

  if (!initialPassword) {
    throw new Error(
      "INITIAL_PASSWORD_REQUIRED",
    );
  }

  await emailTransporter.sendMail({
    from: process.env.EMAIL_USER,

    to: recipientEmail,

    subject:
      "HU-ICT Store Management System - Account Created",

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 650px;
          margin: 0 auto;
          color: #1e293b;
          background: #ffffff;
        "
      >

        <!-- HEADER -->

        <div
          style="
            background: #0b4a8b;
            padding: 24px;
            color: white;
          "
        >
          <h1
            style="
              margin: 0;
              font-size: 24px;
            "
          >
            HU-ICT
          </h1>

          <p
            style="
              margin: 6px 0 0;
              font-size: 14px;
            "
          >
            Store Management System
          </p>
        </div>

        <!-- BODY -->

        <div style="padding: 28px;">

          <h2
            style="
              margin-top: 0;
              color: #0b4a8b;
            "
          >
            Welcome, ${recipientName}
          </h2>

          <p>
            Your account for the
            <strong>
              HU-ICT Store Management System
            </strong>
            has been created successfully.
          </p>

          <!-- ACCOUNT INFORMATION -->

          <div
            style="
              margin: 24px 0;
              padding: 18px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            "
          >

            <h3
              style="
                margin-top: 0;
                color: #0f172a;
              "
            >
              Account Information
            </h3>

            <p style="margin: 8px 0;">
              <strong>Name:</strong>
              ${recipientName}
            </p>

            <p style="margin: 8px 0;">
              <strong>Email:</strong>
              ${recipientEmail}
            </p>

            <p style="margin: 8px 0;">
              <strong>Role:</strong>
              ${roleName}
            </p>

          </div>

          <!-- LOGIN CREDENTIALS -->

          <div
            style="
              margin: 24px 0;
              padding: 20px;
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
            "
          >

            <h3
              style="
                margin-top: 0;
                color: #1e3a8a;
              "
            >
              Initial Login Credentials
            </h3>

            <p>
              Use the following credentials to sign in:
            </p>

            <div
              style="
                margin-top: 14px;
                padding: 14px;
                background: #ffffff;
                border: 1px solid #dbeafe;
                border-radius: 6px;
              "
            >

              <p style="margin: 6px 0;">
                <strong>Email:</strong>
                ${recipientEmail}
              </p>

              <p style="margin: 6px 0;">
                <strong>Initial Password:</strong>
              </p>

              <div
                style="
                  margin-top: 8px;
                  padding: 12px;
                  background: #f1f5f9;
                  border: 1px solid #cbd5e1;
                  border-radius: 6px;
                  font-family: monospace;
                  font-size: 18px;
                  font-weight: bold;
                  letter-spacing: 1px;
                  color: #0f172a;
                  word-break: break-word;
                "
              >
                ${initialPassword}
              </div>

            </div>

          </div>

          <!-- LOGIN INSTRUCTIONS -->

          <div
            style="
              margin: 24px 0;
              padding: 16px;
              border-left: 4px solid #0b4a8b;
              background: #f8fafc;
            "
          >

            <strong>
              Important:
            </strong>

            <p
              style="
                margin: 8px 0 0;
                line-height: 1.6;
              "
            >
              Please sign in using the credentials above
              and change your password as soon as possible.
            </p>

          </div>

          <!-- SECURITY NOTICE -->

          <div
            style="
              margin-top: 24px;
              padding: 16px;
              background: #fff7ed;
              border: 1px solid #fed7aa;
              border-radius: 8px;
            "
          >

            <strong
              style="color: #9a3412;"
            >
              Security Notice
            </strong>

            <p
              style="
                margin: 8px 0 0;
                line-height: 1.6;
                color: #9a3412;
              "
            >
              Keep this email private and do not share
              your login credentials with other users.
            </p>

          </div>

          <p
            style="
              margin-top: 28px;
              line-height: 1.6;
            "
          >
            Regards,<br />
            <strong>
              HU-ICT Store Management System
            </strong>
          </p>

        </div>

      </div>
    `,
  });
}

// =========================================================
// PASSWORD RESET EMAIL
// =========================================================

async function sendPasswordResetEmail({
  recipientEmail,
  recipientName,
  otp,
}) {
  if (!recipientEmail) {
    throw new Error(
      "RECIPIENT_EMAIL_REQUIRED",
    );
  }

  if (!otp) {
    throw new Error(
      "RESET_OTP_REQUIRED",
    );
  }

  await emailTransporter.sendMail({
    from: process.env.EMAIL_USER,

    to: recipientEmail,

    subject:
      "HU-ICT Store Management System - Password Reset",

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 650px;
          margin: 0 auto;
          color: #1e293b;
        "
      >

        <div
          style="
            background: #0b4a8b;
            padding: 24px;
            color: white;
          "
        >
          <h1 style="margin: 0;">
            HU-ICT
          </h1>

          <p style="margin: 6px 0 0;">
            Store Management System
          </p>
        </div>

        <div style="padding: 28px;">

          <h2
            style="
              margin-top: 0;
              color: #0b4a8b;
            "
          >
            Password Reset Request
          </h2>

          <p>
            Hello ${recipientName},
          </p>

          <p>
            A password reset was requested for your
            HU-ICT Store Management System account.
          </p>

          <div
            style="
              margin: 24px 0;
              padding: 22px;
              text-align: center;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            "
          >

            <div
              style="
                font-size: 12px;
                font-weight: bold;
                color: #64748b;
                text-transform: uppercase;
              "
            >
              Verification Code
            </div>

            <div
              style="
                margin-top: 12px;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                color: #0b4a8b;
              "
            >
              ${otp}
            </div>

          </div>

          <p>
            This verification code expires in
            <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request this password reset,
            you can safely ignore this email.
          </p>

          <p style="margin-top: 28px;">
            Regards,<br />
            <strong>
              HU-ICT Store Management System
            </strong>
          </p>

        </div>

      </div>
    `,
  });
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
};