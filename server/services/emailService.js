// Thin wrapper around nodemailer for transactional email (currently just
// password-reset). Mirrors geocodingService.js's shape - one place that
// knows how to talk to the external provider, configured entirely through
// env vars so no credentials are ever hard-coded. The transporter is built
// lazily and cached, so a missing/invalid config only surfaces when an
// email is actually attempted, not at server startup.

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error('Email is not configured (EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASSWORD)');
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465, // 465 = implicit TLS; 587/25 use STARTTLS
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
  });
  return transporter;
}

const BRAND_COLOR = '#3B82F6';

function buildResetEmailHtml({ greetingName, resetUrl }) {
  return `
  <div style="background:#F1F5F9;padding:32px 16px;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;">
      <div style="background:${BRAND_COLOR};padding:24px 32px;">
        <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">MedStock</span>
      </div>
      <div style="padding:32px;">
        <h1 style="font-size:18px;color:#0F172A;margin:0 0 12px;">Reset your password</h1>
        <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px;">
          Hi ${greetingName}, we received a request to reset the password for your MedStock account.
          Click the button below to choose a new one. This link expires in 30 minutes.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;
                  font-size:14px;font-weight:600;padding:12px 24px;border-radius:12px;">
          Reset Password
        </a>
        <p style="font-size:12.5px;color:#94A3B8;line-height:1.6;margin:24px 0 0;">
          If you didn't request this, you can safely ignore this email — your password will stay unchanged.
        </p>
        <p style="font-size:12px;color:#CBD5E1;line-height:1.6;margin:16px 0 0;word-break:break-all;">
          Or paste this link into your browser: ${resetUrl}
        </p>
      </div>
    </div>
  </div>`;
}

/**
 * Sends the password-reset email. Throws on failure (unconfigured provider
 * or delivery error) - callers must decide how to surface that, since the
 * forgot-password flow deliberately never reveals delivery failures to the
 * requester (see authController.forgotPassword).
 */
async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const greetingName = fullName ? fullName.split(' ')[0] : 'there';

  await getTransporter().sendMail({
    from: from ? `MedStock <${from}>` : undefined,
    to,
    subject: 'Reset Your MedStock Password',
    text: `Hi ${greetingName},\n\nWe received a request to reset your MedStock password. Use the link below to choose a new one - it expires in 30 minutes:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email and your password will stay unchanged.\n\n- The MedStock Team`,
    html: buildResetEmailHtml({ greetingName, resetUrl }),
  });
}

module.exports = { sendPasswordResetEmail };
