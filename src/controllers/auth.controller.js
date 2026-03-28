const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/user.model");

const signup = asyncHandler(async (req, res) => {
  const data = await authService.signup(req.body);
  res.status(201).json({ ok: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.json({ ok: true, data });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const data = await authService.verifyEmail({ token: req.query.token });
  res.json({ ok: true, data });
});

const resendVerification = asyncHandler(async (req, res) => {
  const data = await authService.resendVerification(req.body);
  res.json({ ok: true, data });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const data = await authService.requestPasswordReset(req.body);
  res.json({ ok: true, data });
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  res.json({ ok: true, data });
});

const resetPasswordRedirect = asyncHandler(async (req, res) => {
  const token = req.query.token;
  if (!token) {
    throw new ApiError(400, "token is required");
  }

  const base =
    env.resetDeepLinkBaseUrl ||
    env.resetBaseUrl ||
    "chaintrace://reset-password";
  const separator = base.includes("?") ? "&" : "?";
  const deepLink = `${base}${separator}token=${encodeURIComponent(token)}`;

  res.status(200).set("Content-Type", "text/html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reset Password</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; background: #0a0f17; color: #f7f9fc; }
          a { color: #4da3ff; }
          .card { max-width: 520px; margin: 0 auto; background: #111827; padding: 24px; border-radius: 12px; }
          .btn { display: inline-block; margin-top: 16px; padding: 12px 16px; background: #1e88e5; color: #fff; border-radius: 10px; text-decoration: none; }
          .muted { color: #9ca3af; font-size: 14px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Reset your password</h2>
          <p>Tap below to open the ChainTrace app and set a new password.</p>
          <a class="btn" href="${deepLink}">Open in app</a>
          <p class="muted">If nothing happens, copy this link into your browser:</p>
          <p class="muted">${deepLink}</p>
        </div>
        <script>
          setTimeout(function () {
            window.location.href = ${JSON.stringify(deepLink)};
          }, 300);
        </script>
      </body>
    </html>
  `);
});

const refresh = asyncHandler(async (req, res) => {
  const authHeader = req.header("authorization") || req.header("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new ApiError(401, "Missing bearer token");
  }
  const token = authHeader.slice(7).trim();
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (_err) {
    throw new ApiError(401, "Invalid bearer token");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new ApiError(401, "User not found or inactive");
  }

  const data = await authService.refreshSession(user);
  res.json({ ok: true, data });
});

const me = asyncHandler(async (req, res) => {
  const data = authService.userProfile(req.user);
  res.json({ ok: true, data });
});

module.exports = {
  signup,
  login,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  resetPasswordRedirect,
  refresh,
  me,
};
