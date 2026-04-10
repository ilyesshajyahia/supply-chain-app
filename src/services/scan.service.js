const ScanEvent = require("../models/scanEvent.model");
const Product = require("../models/product.model");

async function getPublicScansByQrId(identifier) {
  const key = String(identifier || "").trim();
  if (!key) return [];

  const product = await Product.findOne({
    $or: [{ qrId: key }, { serialNumber: key }],
  }).lean();

  if (product) {
    return ScanEvent.find({ productId: product._id, scanType: "public" })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
  }

  return ScanEvent.find({ qrId: key, scanType: "public" })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();
}

module.exports = { getPublicScansByQrId };
