const AuditLog = require("../models/auditLog.model");

async function logAuditEvent({
  orgId,
  action,
  actorUser,
  targetUser,
  meta,
  req,
}) {
  try {
    await AuditLog.create({
      orgId,
      action,
      actorUserId: actorUser?._id,
      actorEmail: actorUser?.email,
      targetUserId: targetUser?._id,
      targetEmail: targetUser?.email,
      ip: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      meta: meta || null,
    });
  } catch (_err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write audit log");
  }
}

module.exports = { logAuditEvent };
