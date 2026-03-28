const ApiError = require("../utils/ApiError");

function rateLimit({ windowMs, max, keyGenerator, message }) {
  const store = new Map();
  const window = Number(windowMs || 60000);
  const limit = Number(max || 60);

  return function rateLimitMiddleware(req, _res, next) {
    const key = keyGenerator ? keyGenerator(req) : req.ip;
    const now = Date.now();
    const existing = store.get(key);
    if (!existing || now > existing.resetAt) {
      store.set(key, { count: 1, resetAt: now + window });
      return next();
    }

    existing.count += 1;
    store.set(key, existing);

    if (existing.count > limit) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
      const errMessage =
        message ||
        `Too many requests. Try again in ${retryAfterSeconds} seconds.`;
      return next(new ApiError(429, errMessage, { retryAfterSeconds }));
    }

    return next();
  };
}

module.exports = { rateLimit };
