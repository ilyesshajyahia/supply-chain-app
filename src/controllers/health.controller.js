const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const env = require("../config/env");

const health = asyncHandler(async (_req, res) => {
  res.json({
    ok: true,
    message: "Backend healthy",
    timestamp: new Date().toISOString(),
  });
});

const healthDetails = asyncHandler(async (_req, res) => {
  const readyState = mongoose.connection.readyState;
  const rpcHost = (() => {
    try {
      if (!env.rpcUrl) return null;
      return new URL(env.rpcUrl).host;
    } catch (_) {
      return null;
    }
  })();

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    nodeEnv: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      connected: readyState === 1,
      readyState,
    },
    chain: {
      chainId: env.chainId,
      rpcHost,
      registryAddress: env.productRegistryAddress || null,
      lifecycleAddress: env.productLifecycleAddress || null,
    },
    email: {
      provider: env.resendApiKey ? "resend" : "smtp",
      configured: Boolean(env.emailFrom && (env.resendApiKey || env.smtpUser)),
      from: env.emailFrom || null,
    },
  });
});

module.exports = { health, healthDetails };
