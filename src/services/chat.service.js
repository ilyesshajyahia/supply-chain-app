const ApiError = require("../utils/ApiError");
const ChatMessage = require("../models/chatMessage.model");
const Product = require("../models/product.model");

async function ensureProductInOrg({ orgId, qrId }) {
  if (!qrId) return;
  const product = await Product.findOne({ qrId, orgId }).lean();
  if (!product) {
    throw new ApiError(404, "Product thread not found in your organization");
  }
}

async function listMessages({ orgId, qrId, limit = 50 }) {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  await ensureProductInOrg({ orgId, qrId });

  const query = { orgId };
  if (qrId) query.qrId = qrId;
  else query.qrId = null;

  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(normalizedLimit)
    .lean();

  return messages.reverse();
}

async function listMessagesForUser({ user, qrId, limit = 50 }) {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  await ensureProductInOrg({ orgId: user.orgId, qrId });

  const query = { orgId: user.orgId };
  if (qrId) query.qrId = qrId;
  else query.qrId = null;

  await ChatMessage.updateMany(
    {
      ...query,
      seenByUserIds: { $ne: user._id },
    },
    {
      $addToSet: { seenByUserIds: user._id },
    }
  );

  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(normalizedLimit)
    .lean();

  const userId = String(user._id);
  return messages.reverse().map((m) => {
    const seenIds = (m.seenByUserIds || []).map((id) => String(id));
    return {
      id: String(m._id),
      orgId: m.orgId,
      qrId: m.qrId,
      byUserId: String(m.byUserId),
      byName: m.byName,
      byRole: m.byRole,
      text: m.text,
      createdAt: m.createdAt,
      seenByCount: seenIds.length,
      seenByMe: seenIds.includes(userId),
    };
  });
}

async function sendMessage({ user, qrId, text }) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    throw new ApiError(400, "Message text is required");
  }
  if (trimmed.length > 1000) {
    throw new ApiError(400, "Message too long (max 1000 characters)");
  }

  await ensureProductInOrg({ orgId: user.orgId, qrId });

  const doc = await ChatMessage.create({
    orgId: user.orgId,
    qrId: qrId || null,
    byUserId: user._id,
    byName: user.name || "User",
    byRole: user.role,
    text: trimmed,
    seenByUserIds: [user._id],
  });

  return {
    id: String(doc._id),
    orgId: doc.orgId,
    qrId: doc.qrId,
    byUserId: String(doc.byUserId),
    byName: doc.byName,
    byRole: doc.byRole,
    text: doc.text,
    createdAt: doc.createdAt,
    seenByCount: 1,
    seenByMe: true,
  };
}

module.exports = {
  listMessages,
  listMessagesForUser,
  sendMessage,
};
