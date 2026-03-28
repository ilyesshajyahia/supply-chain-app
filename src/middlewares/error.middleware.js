const ApiError = require("../utils/ApiError");

function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const retryAfterSeconds =
    typeof err.details?.retryAfterSeconds === "number"
      ? err.details.retryAfterSeconds
      : null;
  if (status === 429 && retryAfterSeconds) {
    res.set("Retry-After", String(retryAfterSeconds));
  }
  // eslint-disable-next-line no-console
  console.error("API error", {
    requestId: _req.id,
    method: _req.method,
    path: _req.originalUrl,
    status,
    message: err.message,
    details: err.details,
    stack: err.stack,
  });
  res.status(status).json({
    ok: false,
    message: err.message || "Internal server error",
    details: err.details || null,
    requestId: _req.id || null,
  });
}

module.exports = { notFound, errorHandler };
