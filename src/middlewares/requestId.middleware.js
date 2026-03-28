const crypto = require("crypto");

function requestId(req, res, next) {
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex");
  req.id = id;
  res.setHeader("x-request-id", id);
  next();
}

module.exports = { requestId };
