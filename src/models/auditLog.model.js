const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorEmail: { type: String },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetEmail: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "audit_logs" }
);

auditLogSchema.index({ orgId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
