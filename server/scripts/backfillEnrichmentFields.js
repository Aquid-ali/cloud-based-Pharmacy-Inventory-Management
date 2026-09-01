/**
 * One-time (idempotent) backfill for MedicineCatalog documents that predate
 * the AI enrichment feature - in particular the ~11,500-row reference dataset
 * imported via `npm run import:medicines`, which was inserted (via
 * insertMany) before enrichmentStatus/normalizedName/etc. existed on the
 * schema. Mongoose schema defaults only apply when a document is created or
 * re-saved through the ODM - they are never retroactively written onto
 * documents already sitting in MongoDB, so those documents are otherwise
 * invisible to any query that filters on enrichmentStatus (e.g. the bulk
 * "enrich pending/failed medicines" endpoint would find none of them).
 *
 * For each document missing enrichmentStatus entirely:
 *   - normalizedName is computed from its name.
 *   - If it already has real composition + uses + sideEffects (true for
 *     nearly every reference-dataset row), it's marked enrichmentStatus
 *     'completed' with informationSource 'reference-dataset' - this is
 *     already-verified data, not something the AI pipeline needs to touch.
 *   - Otherwise it's left 'pending', so the AI enrichment pipeline picks up
 *     exactly the gaps.
 * Documents that already have enrichmentStatus set (from a previous run of
 * this script, or created after the feature existed) are left untouched.
 *
 * Usage (run from the `server/` directory):
 *   npm run backfill:enrichment-fields              -> performs the real backfill
 *   npm run backfill:enrichment-fields -- --dry-run -> reports only, writes nothing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const MedicineCatalog = require('../models/MedicineCatalog');
const { normalizeMedicineName } = require('../utils/normalizeMedicineName');

const isDryRun = process.argv.includes('--dry-run');
const BATCH_SIZE = 1000;

async function run() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('Could not establish a MongoDB connection. Aborting (no changes made).');
    process.exit(1);
  }

  const cursor = MedicineCatalog.find(
    { enrichmentStatus: { $exists: false } },
    { name: 1, composition: 1, uses: 1, sideEffects: 1, createdAt: 1 }
  )
    .lean()
    .cursor();

  const report = { scanned: 0, markedCompleted: 0, markedPending: 0 };
  let pending = [];

  const flush = async () => {
    if (pending.length === 0) return;
    if (!isDryRun) await MedicineCatalog.bulkWrite(pending, { ordered: false });
    pending = [];
  };

  for await (const doc of cursor) {
    report.scanned += 1;
    const normalizedName = normalizeMedicineName(doc.name);
    const hasFullClinicalData = Boolean(doc.composition && doc.uses && doc.sideEffects);

    const setFields = hasFullClinicalData
      ? {
          normalizedName,
          enrichmentStatus: 'completed',
          enrichmentConfidence: 100,
          informationSource: 'reference-dataset',
          lastEnrichedAt: doc.createdAt || new Date(),
          needsReview: false,
          enrichmentError: '',
        }
      : {
          normalizedName,
          enrichmentStatus: 'pending',
          enrichmentConfidence: 0,
          informationSource: '',
          lastEnrichedAt: null,
          needsReview: false,
          enrichmentError: '',
        };

    if (hasFullClinicalData) report.markedCompleted += 1;
    else report.markedPending += 1;

    pending.push({ updateOne: { filter: { _id: doc._id }, update: { $set: setFields } } });
    if (pending.length >= BATCH_SIZE) await flush();
  }
  await flush();

  console.log('');
  console.log(isDryRun ? 'Enrichment Field Backfill (DRY RUN — no data written)' : 'Enrichment Field Backfill Complete');
  console.log('');
  console.log(`Documents scanned (missing enrichmentStatus): ${report.scanned}`);
  console.log(`Marked 'completed' (already had full clinical data): ${report.markedCompleted}`);
  console.log(`Marked 'pending' (queued for AI enrichment): ${report.markedPending}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('Backfill failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors during failure cleanup
  }
  process.exit(1);
});
