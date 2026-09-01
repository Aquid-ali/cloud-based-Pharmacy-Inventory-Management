/**
 * One-time DEMO seeder that populates realistic Inventory records for the
 * existing Pharmacy documents, drawing medicineId references from the
 * existing MedicineCatalog collection.
 *
 * Usage (run from the `server/` directory):
 *   npm run seed:inventory              -> performs the real insert
 *   npm run seed:inventory -- --dry-run -> calculates + reports only, writes nothing
 *
 * Safety:
 *   - Only ever calls Inventory.bulkWrite() with insertOne operations for NEW
 *     pharmacyId+medicineId combinations. Never updates or deletes anything.
 *   - Never touches MedicineCatalog, Pharmacy, User, Store, or Order documents.
 *   - Never creates new pharmacies or new medicines - only reads their _ids.
 *   - Before building an insert for a given pharmacy+medicine pair, checks a
 *     preloaded set of existing (pharmacyId, medicineId) combinations already
 *     in Inventory and skips it if present, so the script is safe to re-run.
 *   - Prices/dates here are synthetic demo values only - never derived from
 *     MedicineCatalog.reviewStats or any other catalog field.
 */

require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

const { connectDB } = require('../config/db');
const Pharmacy = require('../models/Pharmacy');
const MedicineCatalog = require('../models/MedicineCatalog');
const Inventory = require('../models/Inventory');

const MEDICINES_PER_PHARMACY = 200;
const WRITE_BATCH_SIZE = 500;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const isDryRun = process.argv.includes('--dry-run');

// --- seeded RNG --------------------------------------------------------
// Deterministic per pharmacy (same pharmacy -> same medicine selection on
// every run) while still varying from one pharmacy to the next, satisfying
// "deterministic/randomized selection" without needing external deps.

function seedFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(array, rng) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomFloat(rng, min, max, decimals = 2) {
  const value = rng() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function generateBatchNumber(pharmacyId, medicineId, rng) {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const pharmacyPart = pharmacyId.toString().slice(-4).toUpperCase();
  const medicinePart = medicineId.toString().slice(-4).toUpperCase();
  const randomPart = randomInt(rng, 100, 999);
  return `BN-${pharmacyPart}${medicinePart}-${randomPart}-${suffix}`;
}

// --- demo record generation --------------------------------------------

function buildDemoInventoryDoc(pharmacyId, medicineId, rng) {
  const roll = rng();
  const minimumStock = randomInt(rng, 10, 30);

  let quantity;
  if (roll < 0.75) {
    // In stock: comfortably above the reorder threshold
    quantity = minimumStock + randomInt(rng, 20, 500);
  } else if (roll < 0.9) {
    // Low stock: at or below the reorder threshold, but not empty
    quantity = randomInt(rng, 1, minimumStock);
  } else {
    // Out of stock
    quantity = 0;
  }

  const purchasePrice = randomFloat(rng, 10, 2000);
  const marginPct = randomFloat(rng, 0.1, 0.4, 4);
  const sellingPrice = Math.max(purchasePrice, Number((purchasePrice * (1 + marginPct)).toFixed(2)));

  const now = new Date();
  const manufacturingDate = addMonths(now, -randomInt(rng, 1, 18));
  const expiryDate = addMonths(now, randomInt(rng, 6, 36));

  const doc = {
    pharmacyId,
    medicineId,
    batchNumber: generateBatchNumber(pharmacyId, medicineId, rng),
    quantity,
    purchasePrice,
    sellingPrice,
    expiryDate,
    minimumStock,
    manufacturingDate,
  };
  doc.status = Inventory.computeStatus(doc);
  return doc;
}

// --- main ----------------------------------------------------------------

async function flushBatch(pending, report) {
  if (pending.length === 0) return;

  if (isDryRun) {
    report.inventoryRecordsCreated += pending.length;
    pending.length = 0;
    return;
  }

  const operations = pending.map((doc) => ({ insertOne: { document: doc } }));
  try {
    const result = await Inventory.bulkWrite(operations, { ordered: false });
    report.inventoryRecordsCreated += result.insertedCount || 0;
  } catch (err) {
    const writeErrors = err.writeErrors || [];
    if (writeErrors.length > 0) {
      report.inventoryRecordsCreated += pending.length - writeErrors.length;
      writeErrors.forEach((we) => {
        report.errors += 1;
        report.errorDetails.push(we.errmsg || we.err?.message || String(we));
      });
    } else {
      report.errors += pending.length;
      report.errorDetails.push(err.message);
    }
  }

  pending.length = 0;
}

async function run() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('Could not establish a MongoDB connection. Aborting (no changes made).');
    process.exit(1);
  }

  const pharmacies = await Pharmacy.find().lean();
  if (pharmacies.length === 0) {
    console.error('No pharmacies found. Nothing to seed.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // A stable sort is required here: the per-pharmacy seeded shuffle below is only
  // deterministic (same pharmacy -> same medicine selection on every run) if this
  // array's order is itself stable across runs. Without an explicit sort, Mongo
  // does not guarantee retrieval order, which silently broke idempotency - a
  // re-run could shuffle a differently-ordered array and select a fresh, non-
  // overlapping batch of medicines instead of recognizing them as already seeded.
  const medicineDocs = await MedicineCatalog.find({}, { _id: 1 }).sort({ _id: 1 }).lean();
  const medicineIds = medicineDocs.map((m) => m._id);
  if (medicineIds.length === 0) {
    console.error('No medicines found in MedicineCatalog. Nothing to seed.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Preload existing (pharmacyId, medicineId) combinations once so the
  // per-pharmacy duplicate check below is an in-memory Set lookup rather
  // than a query per candidate medicine.
  const existingPairs = await Inventory.find({}, { pharmacyId: 1, medicineId: 1, _id: 0 }).lean();
  const existingSet = new Set(existingPairs.map((p) => `${p.pharmacyId}:${p.medicineId}`));

  const report = {
    dryRun: isDryRun,
    pharmaciesProcessed: 0,
    medicinesAvailable: medicineIds.length,
    inventoryRecordsCreated: 0,
    existingRecordsSkipped: 0,
    errors: 0,
    errorDetails: [],
    perPharmacy: [],
    distribution: { inStock: 0, lowStock: 0, outOfStock: 0 },
  };

  const targetCount = Math.min(MEDICINES_PER_PHARMACY, medicineIds.length);
  let pending = [];

  for (const pharmacy of pharmacies) {
    const rng = mulberry32(seedFromString(pharmacy._id.toString()));
    const shuffled = seededShuffle(medicineIds, rng);
    // The candidate set is exactly the first `targetCount` entries of the
    // deterministic shuffle - fixed, never expanded. Re-running the script
    // re-derives this same set and finds each pair already in `existingSet`,
    // so it's a true no-op. (An earlier version kept pulling further entries
    // to "backfill" any skipped/already-existing pair, which silently created
    // a fresh non-overlapping batch on every re-run instead of skipping.)
    const candidateIds = shuffled.slice(0, targetCount);

    let createdForPharmacy = 0;
    let skippedForPharmacy = 0;

    for (const medicineId of candidateIds) {
      const key = `${pharmacy._id}:${medicineId}`;
      if (existingSet.has(key)) {
        skippedForPharmacy += 1;
        continue;
      }

      const doc = buildDemoInventoryDoc(pharmacy._id, medicineId, rng);
      if (doc.status === 'Out of Stock') report.distribution.outOfStock += 1;
      else if (doc.status === 'Low Stock') report.distribution.lowStock += 1;
      else report.distribution.inStock += 1;

      pending.push(doc);
      existingSet.add(key); // prevent re-selecting the same pair later in this run
      createdForPharmacy += 1;

      if (pending.length >= WRITE_BATCH_SIZE) {
        await flushBatch(pending, report);
      }
    }

    report.pharmaciesProcessed += 1;
    report.existingRecordsSkipped += skippedForPharmacy;
    report.perPharmacy.push({ name: pharmacy.name, created: createdForPharmacy, skipped: skippedForPharmacy });
  }

  await flushBatch(pending, report);

  console.log('');
  console.log(isDryRun ? 'Demo Inventory Seeding (DRY RUN — no data written)' : 'Demo Inventory Seeding Complete');
  console.log('');
  console.log(`Pharmacies processed: ${report.pharmaciesProcessed}`);
  console.log(`Medicines available: ${report.medicinesAvailable}`);
  console.log(`Inventory records created: ${report.inventoryRecordsCreated}`);
  console.log(`Existing records skipped: ${report.existingRecordsSkipped}`);
  console.log(`Errors: ${report.errors}`);
  console.log('');
  console.log('Stock distribution (of records created):');
  console.log(`  In Stock: ${report.distribution.inStock}`);
  console.log(`  Low Stock: ${report.distribution.lowStock}`);
  console.log(`  Out of Stock: ${report.distribution.outOfStock}`);
  console.log('');
  console.log('Per-pharmacy counts:');
  report.perPharmacy.forEach(({ name, created, skipped }) => {
    const skippedNote = skipped > 0 ? ` (${skipped} already existed)` : '';
    console.log(`  ${name}: ${created}${skippedNote}`);
  });

  if (report.errors > 0) {
    console.log('');
    console.log(`Encountered ${report.errors} error(s):`);
    report.errorDetails.slice(0, 20).forEach((msg) => console.log(`  - ${msg}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('Demo inventory seeding failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors during failure cleanup
  }
  process.exit(1);
});
