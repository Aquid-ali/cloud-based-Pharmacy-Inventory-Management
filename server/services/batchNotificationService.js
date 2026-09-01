/**
 * Decides, for the authenticated customer, which medicines in a page of
 * search/listing results should show the "New Batch Added" indicator right
 * now - and durably records that they've been shown it, in the same call, so
 * a later refresh/re-search/re-navigation never shows it again for that same
 * batch. This is the one place both customer-facing listing endpoints
 * (medicineCatalogController.searchMedicines and
 * pharmacyController.browsePharmacyInventory) resolve the flag, so a medicine
 * appearing on either page behaves identically and is never double-announced.
 */

const MedicineBatchView = require('../models/MedicineBatchView');

/**
 * @param {string|import('mongoose').Types.ObjectId|undefined} userId
 * @param {Array<{ medicineId: any, latestBatchId: any }>} candidates - one
 *   entry per medicine appearing in this response (duplicates across
 *   multiple inventory rows for the same medicine are fine and deduplicated
 *   internally).
 * @returns {Promise<Map<string, boolean>>} medicineId (string) -> newBatch
 */
async function resolveNewBatchFlags(userId, candidates) {
  if (!userId) return new Map();

  // A medicine with no batch event yet (latestBatchId unset - true for the
  // ~11,500 reference-dataset medicines that predate this feature, and any
  // medicine that has simply never had stock added) has nothing to announce.
  const byMedicineId = new Map();
  for (const { medicineId, latestBatchId } of candidates) {
    if (!medicineId || !latestBatchId) continue;
    byMedicineId.set(medicineId.toString(), latestBatchId.toString());
  }
  if (byMedicineId.size === 0) return new Map();

  const medicineIds = Array.from(byMedicineId.keys());
  const existingViews = await MedicineBatchView.find(
    { userId, medicineId: { $in: medicineIds } },
    { medicineId: 1, lastSeenBatchId: 1 }
  ).lean();
  const seenMap = new Map(existingViews.map((v) => [v.medicineId.toString(), v.lastSeenBatchId.toString()]));

  const flags = new Map();
  const upserts = [];

  for (const [medicineId, latestBatchId] of byMedicineId) {
    const isNew = seenMap.get(medicineId) !== latestBatchId;
    flags.set(medicineId, isNew);
    if (isNew) {
      upserts.push({
        updateOne: {
          filter: { userId, medicineId },
          update: { $set: { lastSeenBatchId: latestBatchId } },
          upsert: true,
        },
      });
    }
  }

  if (upserts.length > 0) {
    await MedicineBatchView.bulkWrite(upserts, { ordered: false });
  }

  return flags;
}

module.exports = { resolveNewBatchFlags };
