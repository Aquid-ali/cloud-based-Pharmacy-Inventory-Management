/**
 * One-time import of the master medicine database CSV into the existing
 * `medicinecatalogs` collection (via the MedicineCatalog Mongoose model).
 *
 * Usage (run from the `server/` directory):
 *   npm run import:medicines              -> performs the real import
 *   npm run import:medicines -- --dry-run -> validates + reports only, writes nothing
 *
 * Safety:
 *   - Only ever calls MedicineCatalog.insertMany() with NEW documents.
 *   - Never updates, deletes, or drops anything.
 *   - Never touches any other collection (inventories, pharmacies, stores, users, orders).
 *   - Existing medicineId values (already in the DB, or repeated within the CSV
 *     itself) are skipped rather than inserted, so the script is safe to re-run.
 *   - medicineId is optional in the CSV (matches the schema, which does not mark
 *     it `required` and gives it `default: generateMedicineId`). Rows that omit
 *     it are still imported, with Mongoose generating the id - but since there's
 *     then no natural key to dedupe on, re-running the import will insert those
 *     particular rows again. This CSV includes medicineId for every row, so in
 *     practice re-runs stay idempotent.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { parse } = require('csv-parse/sync');

const { connectDB } = require('../config/db');
const MedicineCatalog = require('../models/MedicineCatalog');

const CSV_PATH = path.join(__dirname, '..', 'data', 'Medicine_Details_Cleaned.csv');
const REPORT_PATH = path.join(__dirname, '..', 'data', 'medicine-import-report.json');
const BATCH_SIZE = 750;

const isDryRun = process.argv.includes('--dry-run');

// --- helpers ---------------------------------------------------------------

// Trims + collapses repeated internal whitespace without touching wording,
// then maps blank strings to null so "missing" is unambiguous downstream.
function cleanText(value) {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).trim().replace(/\s+/g, ' ');
  return cleaned.length === 0 ? null : cleaned;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Returns a Number, or NaN if the cell isn't a valid number (distinct from
// "blank", which callers check for separately).
function toNumberOrNaN(value) {
  const trimmed = value === undefined || value === null ? '' : String(value).trim();
  if (trimmed === '') return NaN;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
}

// The cleaned CSV's headers already match the target schema field names
// (e.g. "name", "reviewStats.excellent") rather than the original raw-export
// names (e.g. "medicineName", "excellentReview"). These helpers accept
// either, so the importer works against both header styles.
function pick(row, ...keys) {
  for (const key of keys) {
    const val = cleanText(row[key]);
    if (val !== null) return val;
  }
  return null;
}

function pickRaw(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return undefined;
}

/**
 * Transforms + validates a single CSV row.
 * Returns { doc } on success, or { skip: reason, detail } when the row
 * must be excluded from the import entirely.
 * `report` is mutated in place to record per-category counters/errors.
 */
function processRow(row, rowNumber, seenInFile, existingIds, report) {
  // medicineId is NOT required: the schema gives it `default: generateMedicineId`,
  // so when the CSV omits it (or a future CSV doesn't have the column at all),
  // Mongoose fills it in on insert. When the CSV does provide one, it's used
  // as-is and drives the duplicate/already-exists checks below.
  const medicineId = pick(row, 'medicineId');
  const name = pick(row, 'name', 'medicineName');
  const composition = pick(row, 'composition');
  const uses = pick(row, 'uses');
  const sideEffects = pick(row, 'sideEffects');
  const rawImageUrl = pick(row, 'imageUrl');
  const manufacturer = pick(row, 'manufacturer');

  // 1. Required fields — matches exactly what MedicineCatalog.js marks `required`.
  const missing = [];
  if (!name) missing.push('name');
  if (!composition) missing.push('composition');
  if (!manufacturer) missing.push('manufacturer');
  if (missing.length > 0) {
    report.missingRequiredFields += 1;
    report.errors.push({
      row: rowNumber,
      medicineId: medicineId || null,
      type: 'missingRequiredFields',
      reason: `Missing required field(s): ${missing.join(', ')}`,
    });
    return { skip: 'missingRequiredFields' };
  }

  // 2. Duplicate medicineId within the CSV itself (only when the CSV supplies one) --
  if (medicineId) {
    if (seenInFile.has(medicineId)) {
      report.duplicateMedicineIds += 1;
      report.errors.push({
        row: rowNumber,
        medicineId,
        type: 'duplicateMedicineId',
        reason: 'medicineId appears more than once in the CSV',
      });
      return { skip: 'duplicateMedicineId' };
    }
    seenInFile.add(medicineId);

    // 3. Already present in the database ---------------------------------------
    if (existingIds.has(medicineId)) {
      return { skip: 'alreadyExists' };
    }
  }

  // 4. Review stats -----------------------------------------------------------
  // reviewStats is optional as a whole: if all three columns are blank, the
  // medicine is still imported without review data. But if any value is
  // present, all three must be valid numbers that sum to 100 - otherwise the
  // whole record is skipped (values are never silently corrected).
  const rawExcellent = pickRaw(row, 'reviewStats.excellent', 'excellentReview');
  const rawAverage = pickRaw(row, 'reviewStats.average', 'averageReview');
  const rawPoor = pickRaw(row, 'reviewStats.poor', 'poorReview');
  const allBlank = [rawExcellent, rawAverage, rawPoor].every((v) => v === undefined);

  let reviewStats;
  if (!allBlank) {
    const excellent = toNumberOrNaN(rawExcellent);
    const average = toNumberOrNaN(rawAverage);
    const poor = toNumberOrNaN(rawPoor);
    const anyInvalidNumber = [excellent, average, poor].some((n) => Number.isNaN(n));
    const sum = excellent + average + poor;

    if (anyInvalidNumber || sum !== 100) {
      report.invalidReviewRecords += 1;
      report.errors.push({
        row: rowNumber,
        medicineId,
        type: 'invalidReviewRecord',
        reason: anyInvalidNumber
          ? `Non-numeric review value(s): excellent=${rawExcellent}, average=${rawAverage}, poor=${rawPoor}`
          : `Review percentages sum to ${sum}, expected 100 (excellent=${excellent}, average=${average}, poor=${poor})`,
      });
      return { skip: 'invalidReviewRecord' };
    }

    reviewStats = { excellent, average, poor };
  }

  // 5. Image URL ----------------------------------------------------------------
  // Invalid image URLs never cause the medicine to be skipped - they're
  // reported and stored as null instead.
  let imageUrl = null;
  if (rawImageUrl !== null) {
    if (isValidHttpUrl(rawImageUrl)) {
      imageUrl = rawImageUrl;
    } else {
      report.invalidImageUrls += 1;
      report.errors.push({
        row: rowNumber,
        medicineId,
        type: 'invalidImageUrl',
        reason: `"${rawImageUrl}" is not a valid http/https URL`,
      });
      imageUrl = null;
    }
  }

  const doc = {
    name,
    composition,
    manufacturer,
  };
  // Only set medicineId when the CSV provided one - otherwise leave it unset
  // so Mongoose's `default: generateMedicineId` produces it on insert.
  if (medicineId) doc.medicineId = medicineId;
  if (uses !== null) doc.uses = uses;
  if (sideEffects !== null) doc.sideEffects = sideEffects;
  if (imageUrl !== null) doc.imageUrl = imageUrl;
  if (reviewStats) doc.reviewStats = reviewStats;

  return { doc };
}

async function flushBatch(pending, report) {
  if (pending.length === 0) return;

  if (isDryRun) {
    report.successfullyImported += pending.length;
    pending.length = 0;
    return;
  }

  try {
    const result = await MedicineCatalog.insertMany(pending, { ordered: false });
    report.successfullyImported += result.length;
  } catch (err) {
    // With ordered:false, Mongoose still inserts every doc that passed
    // validation and collects the rest here (schema errors + duplicate-key
    // errors from the unique indexes) instead of aborting the whole batch.
    const writeErrors = err.writeErrors || (Array.isArray(err.errors) ? err.errors : []);
    const failedIndexes = new Set();

    if (Array.isArray(writeErrors) && writeErrors.length > 0) {
      writeErrors.forEach((we) => {
        const index = we.index ?? we.err?.index;
        const failedDoc = index !== undefined ? pending[index] : undefined;
        if (index !== undefined) failedIndexes.add(index);
        report.skippedInvalid += 1;
        report.errors.push({
          medicineId: failedDoc ? failedDoc.medicineId : undefined,
          type: 'insertError',
          reason: we.errmsg || we.err?.message || String(we),
        });
      });
      report.successfullyImported += pending.length - failedIndexes.size;
    } else {
      // Whole batch failed for a reason we can't attribute per-document.
      report.skippedInvalid += pending.length;
      report.errors.push({
        type: 'insertError',
        reason: err.message,
        affectedCount: pending.length,
      });
    }
  }

  pending.length = 0;
}

async function run() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found at: ${CSV_PATH}`);
    console.error('Place your cleaned CSV at server/data/Medicine_Details_Cleaned.csv and re-run.');
    process.exit(1);
  }

  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('Could not establish a MongoDB connection. Aborting import (no changes made).');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  // Preload existing medicineIds once, instead of a per-row query, so the
  // script stays fast on large CSVs while still being safe to re-run.
  const existingDocs = await MedicineCatalog.find({}, { medicineId: 1, _id: 0 }).lean();
  const existingIds = new Set(existingDocs.map((d) => d.medicineId));

  const report = {
    totalRows: rows.length,
    successfullyImported: 0,
    skippedExisting: 0,
    skippedInvalid: 0,
    duplicateMedicineIds: 0,
    invalidReviewRecords: 0,
    invalidImageUrls: 0,
    missingRequiredFields: 0,
    dryRun: isDryRun,
    generatedAt: new Date().toISOString(),
    errors: [],
  };

  const seenInFile = new Set();
  let pending = [];

  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = i + 2; // +1 for 0-index, +1 for the header row
    const result = processRow(rows[i], rowNumber, seenInFile, existingIds, report);

    if (result.skip === 'alreadyExists') {
      report.skippedExisting += 1;
      continue;
    }
    if (result.skip) {
      report.skippedInvalid += 1;
      continue;
    }

    pending.push(result.doc);
    if (pending.length >= BATCH_SIZE) {
      await flushBatch(pending, report);
    }
  }
  await flushBatch(pending, report);

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('');
  console.log(isDryRun ? 'Medicine Catalog Import (DRY RUN — no data written)' : 'Medicine Catalog Import Complete');
  console.log('');
  console.log(`Total CSV records: ${report.totalRows}`);
  console.log(`Successfully imported: ${report.successfullyImported}`);
  console.log(`Already existing/skipped: ${report.skippedExisting}`);
  console.log(`Invalid/skipped: ${report.skippedInvalid}`);
  console.log(`Invalid image URLs: ${report.invalidImageUrls}`);
  console.log(`Invalid review records: ${report.invalidReviewRecords}`);
  console.log('');
  console.log(`Full report written to: ${REPORT_PATH}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('Import failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors during failure cleanup
  }
  process.exit(1);
});
