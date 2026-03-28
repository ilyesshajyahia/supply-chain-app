const express = require("express");
const controller = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { rateLimit } = require("../middlewares/rateLimit.middleware");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `${req.ip}:${req.body?.email || "anon"}:auth`,
  message: "Too many auth attempts. Try again later.",
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `${req.ip}:${req.body?.email || "anon"}:email`,
  message: "Too many email requests. Try again later.",
});

router.post("/signup", authLimiter, controller.signup);
router.post("/login", authLimiter, controller.login);
router.get("/verify-email", controller.verifyEmail);
router.post("/resend-verification", emailLimiter, controller.resendVerification);
router.post("/request-password-reset", emailLimiter, controller.requestPasswordReset);
router.post("/reset-password", authLimiter, controller.resetPassword);
router.get("/reset-password", controller.resetPasswordRedirect);
router.post("/refresh", controller.refresh);
router.get("/me", requireAuth, controller.me);

module.exports = router;
