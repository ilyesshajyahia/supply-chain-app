const env = require("../config/env");

async function sendViaMailtrap({ to, subject, text, html }) {
  if (!env.mailtrapApiKey) {
    // eslint-disable-next-line no-console
    console.error("MAILTRAP_API_KEY missing");
    throw new Error("MAILTRAP_API_KEY must be set for email verification");
  }

  const response = await fetch("https://send.api.mailtrap.io/api/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.mailtrapApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { email: env.emailFrom || "sandbox@mailtrap.io", name: "ChainTrace" },
      to: [{ email: to }],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    // eslint-disable-next-line no-console
    console.error("Mailtrap error:", response.status, body);
    throw new Error(`Mailtrap error ${response.status}`);
  }
}

async function sendVerificationEmail({
  to,
  verificationUrl,
  fallbackUrl,
}) {
  try {
    await sendViaMailtrap({
      to,
      subject: "Verify your ChainTrace account",
      text: `Please verify your email by opening this link: ${verificationUrl}\nIf it is not clickable, use this fallback link: ${fallbackUrl}`,
      html: `
        <p>Please verify your email to activate your ChainTrace account.</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If the link is not clickable, open:</p>
        <p><a href="${fallbackUrl}">${fallbackUrl}</a></p>
        <p>This link expires in 30 minutes.</p>
      `,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Email sendVerificationEmail failed:", err?.message || err);
    throw err;
  }
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  try {
    await sendViaMailtrap({
      to,
      subject: "Reset your ChainTrace password",
      text: `Reset your password by opening this link: ${resetUrl}`,
      html: `
          <p>You requested a password reset for your ChainTrace account.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link expires in 30 minutes.</p>
        `,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Email sendPasswordResetEmail failed:", err?.message || err);
    throw err;
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
