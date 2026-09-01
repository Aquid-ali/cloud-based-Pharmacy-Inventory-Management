/**
 * Core AI enrichment pipeline:
 *
 *   Medicine in MongoDB (MedicineCatalog)
 *     -> normalize medicine name
 *     -> identify medicine + retrieve reliable information (aiProvider)
 *     -> validate the structured response (zod, inside aiProvider)
 *     -> save only the still-missing fields to MongoDB
 *     -> update enrichmentStatus
 *
 * Both the single-medicine endpoint and the bulk endpoint call the same
 * enrichOneMedicine() function, so behavior (idempotency, field-preservation,
 * confidence gating) never diverges between the two entry points.
 *
 * This module never touches pharmacy-specific data (Inventory) at all - it
 * only ever reads/writes MedicineCatalog, which is exactly the centralized,
 * pharmacy-independent medicine information this feature is scoped to.
 */

const MedicineCatalog = require('../models/MedicineCatalog');
const aiProvider = require('./aiProvider');

const CONFIDENCE_THRESHOLD = 60;

// Fields the pipeline is allowed to write. Never includes _id, medicineId,
// name, manufacturer, reviewStats, imageUrl, or any Inventory/pharmacy field.
const CLINICAL_FIELDS = [
  'genericName', 'brandName', 'composition', 'strength', 'dosageForm',
  'description', 'uses', 'howItWorks', 'sideEffects', 'precautions',
  'contraindications', 'storage', 'prescriptionRequired',
];

// The AI schema uses arrays for list-shaped fields (composition/uses/
// sideEffects/precautions/contraindications) to match the structure the
// project's spec calls for, but MedicineCatalog stores them as strings (the
// same format the existing ~11,500-row reference dataset already uses) - so
// the display code (customer/MedicineDetails.jsx, the admin modal) never has
// to branch on "is this an array or a string".
function arrayToText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join('. ') || null;
  return value || null;
}

function proposalToFieldMap(proposal) {
  return {
    genericName: proposal.genericName || null,
    brandName: proposal.brandName || null,
    composition: arrayToText(proposal.composition),
    strength: proposal.strength || null,
    dosageForm: proposal.dosageForm || null,
    description: proposal.description || null,
    uses: arrayToText(proposal.uses),
    howItWorks: proposal.howItWorks || null,
    sideEffects: arrayToText(proposal.sideEffects),
    precautions: arrayToText(proposal.precautions),
    contraindications: arrayToText(proposal.contraindications),
    storage: proposal.storage || null,
    prescriptionRequired: proposal.prescriptionRequired ?? null,
  };
}

/**
 * Enriches a single MedicineCatalog document.
 *
 * @param {string} medicineId
 * @param {{ force?: boolean }} options - force=true re-runs enrichment (and
 *   overwrites existing clinical fields) even if already 'completed' -
 *   otherwise a completed medicine is left untouched (section 10: "Refresh
 *   Information" is opt-in, not automatic on every call).
 */
async function enrichOneMedicine(medicineId, { force = false } = {}) {
  const medicine = await MedicineCatalog.findById(medicineId);
  if (!medicine) {
    return { outcome: 'not_found' };
  }

  if (medicine.enrichmentStatus === 'completed' && !force) {
    return { outcome: 'already_completed', medicine };
  }

  medicine.enrichmentStatus = 'processing';
  medicine.enrichmentError = '';
  await medicine.save();

  const result = await aiProvider.enrichMedicineInfo({
    name: medicine.name,
    manufacturer: medicine.manufacturer,
    genericName: medicine.genericName,
    dosageForm: medicine.dosageForm,
    composition: medicine.composition,
  });

  if (!result.ok) {
    medicine.enrichmentStatus = 'failed';
    medicine.enrichmentError = result.reason;
    medicine.lastEnrichedAt = new Date();
    await medicine.save();
    return { outcome: 'failed', medicine, reason: result.reason };
  }

  if (!result.identified || result.confidence < CONFIDENCE_THRESHOLD) {
    medicine.enrichmentStatus = 'needs_review';
    medicine.needsReview = true;
    medicine.enrichmentConfidence = result.confidence;
    medicine.enrichmentError = result.data.reason || 'Unable to confidently identify medicine';
    medicine.enrichmentProposal = result.data;
    medicine.lastEnrichedAt = new Date();
    await medicine.save();
    return { outcome: 'needs_review', medicine };
  }

  const fieldMap = proposalToFieldMap(result.data);
  CLINICAL_FIELDS.forEach((field) => {
    const isEmpty = medicine[field] === undefined || medicine[field] === null || medicine[field] === '';
    if ((force || isEmpty) && fieldMap[field] !== null) {
      medicine[field] = fieldMap[field];
    }
  });

  medicine.enrichmentStatus = 'completed';
  medicine.enrichmentConfidence = result.confidence;
  medicine.informationSource = result.source;
  medicine.lastEnrichedAt = new Date();
  medicine.needsReview = false;
  medicine.enrichmentError = '';
  medicine.enrichmentProposal = null;
  await medicine.save();

  return { outcome: 'completed', medicine };
}

// Guards against two overlapping bulk runs (e.g. an admin double-clicking
// "Enrich All"). A single Node process is enough here - this isn't meant to
// coordinate across multiple server instances.
let bulkRunState = { running: false, startedAt: null, total: 0, processed: 0 };

function getBulkRunState() {
  return bulkRunState;
}

/**
 * Runs enrichment across every MedicineCatalog document whose enrichmentStatus
 * is in `statuses`, with limited concurrency so hundreds/thousands of
 * medicines are never all sent to the AI provider at once. One medicine
 * failing never stops the rest - each is caught and recorded independently.
 * Progress lives entirely in MongoDB (each document's own enrichmentStatus),
 * so the admin dashboard can watch it via polling regardless of how long this
 * takes; the HTTP endpoint that calls this does not await it.
 */
async function enrichAllMedicines({ statuses = ['pending', 'failed'], concurrency = 3 } = {}) {
  if (bulkRunState.running) {
    return { started: false, reason: 'A bulk enrichment run is already in progress' };
  }

  const ids = await MedicineCatalog.find({ enrichmentStatus: { $in: statuses } }, { _id: 1 }).lean();
  bulkRunState = { running: true, startedAt: new Date(), total: ids.length, processed: 0 };

  // Fire-and-forget: the caller (the HTTP controller) does not await this.
  (async () => {
    let cursor = 0;
    const worker = async () => {
      while (cursor < ids.length) {
        const index = cursor;
        cursor += 1;
        try {
          await enrichOneMedicine(ids[index]._id, { force: false });
        } catch {
          // enrichOneMedicine already writes 'failed' status for AI-side
          // failures; this guards against a truly unexpected error (e.g. a
          // transient DB write failure) so it never aborts the whole batch.
        }
        bulkRunState.processed += 1;
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, ids.length) || 0 }, () => worker());
    await Promise.all(workers);
    bulkRunState = { ...bulkRunState, running: false };
  })().catch((error) => {
    // Every enrichOneMedicine call is already individually try/caught above,
    // so reaching here means something truly unexpected happened (e.g. a
    // failure in the batch-selection query itself) - log it rather than
    // silently resetting state, so a bulk run that dies isn't a silent no-op.
    console.error(`[${new Date().toISOString()}] Bulk enrichment run failed: ${error.message}`);
    bulkRunState = { ...bulkRunState, running: false };
  });

  return { started: true, queued: ids.length };
}

async function getEnrichmentStats() {
  const counts = await MedicineCatalog.aggregate([
    { $group: { _id: '$enrichmentStatus', count: { $sum: 1 } } },
  ]);

  const stats = { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, needs_review: 0 };
  counts.forEach(({ _id, count }) => {
    if (_id && Object.prototype.hasOwnProperty.call(stats, _id)) stats[_id] = count;
    stats.total += count;
  });

  return { ...stats, bulkRun: getBulkRunState() };
}

module.exports = {
  enrichOneMedicine,
  enrichAllMedicines,
  getEnrichmentStats,
  getBulkRunState,
  CONFIDENCE_THRESHOLD,
};
