/**
 * One-time (but safely re-runnable) migration that takes every medicine already
 * sitting in the legacy, per-store `Medicine` collection - including everything
 * brought in via Import Medicines (CSV upload) as well as anything added
 * through Add/Edit Medicine - and gives it a place in the newer master/inventory
 * split: a `MedicineCatalog` entry (shared medical information, reusable across
 * pharmacies) linked to a `Inventory` batch (pharmacy-specific stock).
 *
 * For each legacy Medicine:
 *   1. Its Store is mapped to a Pharmacy (created once, reused on every re-run
 *      via a deterministic _id - see deterministicObjectId below).
 *   2. It's matched against an existing MedicineCatalog entry by exact
 *      (name, manufacturer), then by exact name alone if that's unambiguous.
 *      This is intentionally exact-match only - never fuzzy - so a medicine is
 *      never linked to a different drug's clinical data. A match found this way
 *      may already carry verified composition/uses/sideEffects (e.g. from
 *      `npm run import:medicines`, the ~11,500-row reference dataset already in
 *      this project) - if so, enrichmentStatus is marked 'completed' with
 *      informationSource 'reference-dataset'. No match found -> a new catalog
 *      entry is created with only what's safely derivable from the legacy
 *      record itself (name, genericName, manufacturer, description, and
 *      dosageForm from category, since category values are themselves dosage
 *      forms - Tablet/Capsule/Syrup/etc), left at enrichmentStatus 'pending' -
 *      pick those up with the AI enrichment pipeline (POST .../enrich-all).
 *      Every other clinical field (composition, strength, uses, howItWorks,
 *      sideEffects, precautions, contraindications, storage,
 *      prescriptionRequired) is left unset rather than guessed - the frontend
 *      renders unset fields as "Not available", never inventing content.
 *   3. Its own quantity/batch/price/expiry/supplier data becomes one Inventory
 *      record, linked to that Pharmacy + MedicineCatalog entry.
 *
 * Usage (run from the `server/` directory):
 *   npm run migrate:csv-medicines              -> performs the real migration
 *   npm run migrate:csv-medicines -- --dry-run -> reports only, writes nothing
 *
 * Safety / idempotency:
 *   - Never modifies or deletes the source `Medicine` documents, Store, or User
 *     collections. Import Medicines (CSV upload) and every existing legacy admin
 *     flow keep working exactly as before - this only ever adds Pharmacy /
 *     MedicineCatalog / Inventory documents alongside them.
 *   - Pharmacy: one per Store, found by a deterministic _id derived from the
 *     Store's own _id, so re-running always resolves to the same Pharmacy
 *     instead of creating duplicates. Missing fields (e.g. location) on an
 *     already-migrated Pharmacy are backfilled; nothing is overwritten.
 *   - MedicineCatalog: matched by exact (name, manufacturer) first, exact name
 *     second. On a match, only fields that are currently unset are backfilled -
 *     an existing non-empty value (from the verified reference import, or a
 *     previous migration run, or manual admin edits) is never overwritten. No
 *     match -> a new document is created.
 *   - Inventory: matched by the same (pharmacyId, medicineId, batchNumber) the
 *     schema's unique index enforces. If a matching record already exists (from
 *     a previous run of this script), it is left completely untouched - its
 *     quantity/prices are never reset, even if the source Medicine's values
 *     have since changed (e.g. from real sales). Only a genuinely new
 *     (pharmacy, medicine, batch) combination is inserted.
 */

require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

const { connectDB } = require('../config/db');
const Medicine = require('../models/Medicine');
const Store = require('../models/Store');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const MedicineCatalog = require('../models/MedicineCatalog');
const Inventory = require('../models/Inventory');

const isDryRun = process.argv.includes('--dry-run');

// Same technique as scripts/demoPharmacyData.js: a stable ObjectId derived from
// a fixed seed string, so "find or create" collapses to a plain findById on
// every re-run instead of needing a secondary unique key on Pharmacy.name.
function deterministicObjectId(seed) {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  return new mongoose.Types.ObjectId(hash.slice(0, 24));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Pharmacy resolution -----------------------------------------------

async function resolvePharmacyForStore(store, fallbackOwnerId, report) {
  const pharmacyId = deterministicObjectId(`migrated-pharmacy:${store._id.toString()}`);
  const existing = await Pharmacy.findById(pharmacyId);

  if (existing) {
    const backfill = {};
    if (!existing.location?.lat && store.location?.lat) backfill.location = store.location;
    if (!existing.phone && store.phone) backfill.phone = store.phone;
    if (Object.keys(backfill).length > 0) {
      if (!isDryRun) await Pharmacy.updateOne({ _id: pharmacyId }, { $set: backfill });
      report.pharmaciesBackfilled += 1;
    } else {
      report.pharmaciesReused += 1;
    }
    return existing._id;
  }

  const ownerId = fallbackOwnerId;
  if (!ownerId) {
    report.errors.push({ type: 'noPharmacyOwner', store: store.name });
    return null;
  }

  report.pharmaciesCreated += 1;
  if (isDryRun) return pharmacyId;

  await Pharmacy.create({
    _id: pharmacyId,
    name: store.name,
    address: store.address.line1,
    city: store.address.city,
    state: store.address.state,
    pincode: store.address.pincode,
    phone: store.phone,
    ownerId,
    status: 'active',
    location: store.location,
  });
  return pharmacyId;
}

// --- MedicineCatalog resolution -----------------------------------------

async function resolveMedicineCatalogEntry(medicine, report) {
  const escapedName = escapeRegex(medicine.medicineName.trim());
  const escapedManufacturer = escapeRegex(medicine.manufacturer.trim());

  let match = await MedicineCatalog.findOne({
    name: new RegExp(`^${escapedName}$`, 'i'),
    manufacturer: new RegExp(`^${escapedManufacturer}$`, 'i'),
  });

  if (!match) {
    const nameMatches = await MedicineCatalog.find({ name: new RegExp(`^${escapedName}$`, 'i') });
    if (nameMatches.length === 1) {
      match = nameMatches[0];
    }
  }

  const dosageForm = medicine.category || undefined;

  if (match) {
    const hadVerifiedClinicalData = Boolean(match.composition && match.uses && match.sideEffects);
    const backfill = {};
    if (!match.genericName && medicine.genericName) backfill.genericName = medicine.genericName;
    if (!match.description && medicine.description) backfill.description = medicine.description;
    if (!match.dosageForm && dosageForm) backfill.dosageForm = dosageForm;
    if (hadVerifiedClinicalData && (!match.enrichmentStatus || match.enrichmentStatus === 'pending')) {
      backfill.enrichmentStatus = 'completed';
      backfill.enrichmentConfidence = 100;
      backfill.informationSource = 'reference-dataset';
      backfill.lastEnrichedAt = new Date();
    }

    if (Object.keys(backfill).length > 0) {
      if (!isDryRun) {
        Object.assign(match, backfill);
        await match.save();
      }
      report.catalogEntriesBackfilled += 1;
    } else {
      report.catalogEntriesReused += 1;
    }
    if (hadVerifiedClinicalData) report.catalogEntriesLinkedToVerifiedData += 1;

    return match._id;
  }

  report.catalogEntriesCreatedBare += 1;
  if (isDryRun) return deterministicObjectId(`dry-run-catalog:${escapedName}:${escapedManufacturer}`);

  const created = await MedicineCatalog.create({
    name: medicine.medicineName,
    manufacturer: medicine.manufacturer,
    genericName: medicine.genericName || undefined,
    description: medicine.description || undefined,
    dosageForm,
    enrichmentStatus: 'pending',
  });
  return created._id;
}

// --- Inventory resolution ------------------------------------------------

async function resolveInventoryRecord(medicine, pharmacyId, medicineCatalogId, report) {
  const existing = await Inventory.findOne({
    pharmacyId,
    medicineId: medicineCatalogId,
    batchNumber: medicine.batchNumber,
  });

  if (existing) {
    report.inventoryRecordsAlreadyExisted += 1;
    return;
  }

  report.inventoryRecordsCreated += 1;
  if (isDryRun) return;

  const doc = {
    pharmacyId,
    medicineId: medicineCatalogId,
    batchNumber: medicine.batchNumber,
    quantity: medicine.quantity,
    purchasePrice: medicine.buyingPrice,
    sellingPrice: medicine.sellingPrice,
    expiryDate: medicine.expiryDate,
    supplier: medicine.supplier || undefined,
  };
  if (Number.isFinite(medicine.reorderLevel)) doc.minimumStock = medicine.reorderLevel;
  doc.status = Inventory.computeStatus(doc);

  await Inventory.create(doc);
}

// --- main ------------------------------------------------------------------

async function run() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('Could not establish a MongoDB connection. Aborting (no changes made).');
    process.exit(1);
  }

  const medicines = await Medicine.find({}).sort({ store: 1, createdAt: 1 });

  const report = {
    dryRun: isDryRun,
    medicinesFound: medicines.length,
    medicinesProcessed: 0,
    pharmaciesCreated: 0,
    pharmaciesReused: 0,
    pharmaciesBackfilled: 0,
    catalogEntriesCreatedBare: 0,
    catalogEntriesReused: 0,
    catalogEntriesBackfilled: 0,
    catalogEntriesLinkedToVerifiedData: 0,
    inventoryRecordsCreated: 0,
    inventoryRecordsAlreadyExisted: 0,
    errors: [],
    generatedAt: new Date().toISOString(),
  };

  if (medicines.length === 0) {
    console.log('No medicines found in the legacy Medicine collection. Nothing to migrate.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const storeCache = new Map(); // storeId -> Pharmacy _id (or null if unresolvable)
  const storeDocCache = new Map(); // storeId -> Store doc
  const storeOwnerCache = new Map(); // storeId -> fallback owner User _id

  for (const medicine of medicines) {
    const storeId = medicine.store.toString();

    if (!storeCache.has(storeId)) {
      let store = storeDocCache.get(storeId);
      if (!store) {
        store = await Store.findById(medicine.store);
        storeDocCache.set(storeId, store);
      }
      if (!store) {
        report.errors.push({ type: 'missingStore', medicineId: medicine._id.toString(), storeId });
        storeCache.set(storeId, null);
      } else {
        let ownerId = storeOwnerCache.get(storeId);
        if (ownerId === undefined) {
          const storeAdmin = await User.findOne({ role: 'Admin', store: medicine.store });
          ownerId = storeAdmin ? storeAdmin._id : medicine.createdBy;
          storeOwnerCache.set(storeId, ownerId);
        }
        const pharmacyId = await resolvePharmacyForStore(store, ownerId, report);
        storeCache.set(storeId, pharmacyId);
      }
    }

    const pharmacyId = storeCache.get(storeId);
    if (!pharmacyId) {
      continue; // already recorded in report.errors above
    }

    const medicineCatalogId = await resolveMedicineCatalogEntry(medicine, report);
    await resolveInventoryRecord(medicine, pharmacyId, medicineCatalogId, report);
    report.medicinesProcessed += 1;
  }

  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, '..', 'data', 'csv-medicine-migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('');
  console.log(isDryRun ? 'CSV Medicine Migration (DRY RUN — no data written)' : 'CSV Medicine Migration Complete');
  console.log('');
  console.log(`Legacy medicines found: ${report.medicinesFound}`);
  console.log(`Legacy medicines processed: ${report.medicinesProcessed}`);
  console.log('');
  console.log(`Pharmacies created: ${report.pharmaciesCreated}`);
  console.log(`Pharmacies reused: ${report.pharmaciesReused}`);
  console.log(`Pharmacies backfilled: ${report.pharmaciesBackfilled}`);
  console.log('');
  console.log(`Catalog entries linked to verified reference data: ${report.catalogEntriesLinkedToVerifiedData}`);
  console.log(`Catalog entries reused (no new info to add): ${report.catalogEntriesReused}`);
  console.log(`Catalog entries backfilled with new info: ${report.catalogEntriesBackfilled}`);
  console.log(`Catalog entries created bare (no match found): ${report.catalogEntriesCreatedBare}`);
  console.log('');
  console.log(`Inventory records created: ${report.inventoryRecordsCreated}`);
  console.log(`Inventory records already existed (untouched): ${report.inventoryRecordsAlreadyExisted}`);

  if (report.errors.length > 0) {
    console.log('');
    console.log(`Encountered ${report.errors.length} error(s):`);
    report.errors.slice(0, 20).forEach((e) => console.log(`  - ${JSON.stringify(e)}`));
  }

  console.log('');
  console.log(`Full report written to: ${reportPath}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('Migration failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors during failure cleanup
  }
  process.exit(1);
});
