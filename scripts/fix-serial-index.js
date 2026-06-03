/**
 * One-time script: fixes the serialNumber sparse-unique index issue.
 *
 * MongoDB's sparse index skips documents where the field is ABSENT,
 * but NOT where it's explicitly set to null.  Previous code was saving
 * serialNumber: null, causing duplicate-key errors.
 *
 * This script:
 *   1. $unsets serialNumber on every document where it is null
 *   2. Drops the old index so Mongoose can recreate it cleanly
 *
 * Usage:  node scripts/fix-serial-index.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const col = db.collection("products");

  // 1. Remove the serialNumber field from docs where it is null
  const updateResult = await col.updateMany(
    { serialNumber: null },
    { $unset: { serialNumber: "" } }
  );
  console.log(`Unset serialNumber on ${updateResult.modifiedCount} documents`);

  // 2. Drop the stale unique index (ignore error if it doesn't exist)
  try {
    await col.dropIndex("serialNumber_1");
    console.log("Dropped old serialNumber_1 index");
  } catch (err) {
    if (err.codeName === "IndexNotFound") {
      console.log("serialNumber_1 index not found, nothing to drop");
    } else {
      throw err;
    }
  }

  console.log("Done! Restart the backend so Mongoose recreates the index.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
