const asyncHandler = require('express-async-handler');
const MedicineCatalog = require('../models/MedicineCatalog');
const ApiError = require('../utils/ApiError');
const enrichmentService = require('../services/medicineEnrichmentService');
const aiProvider = require('../services/aiProvider');

const OUTCOME_MESSAGES = {
  already_completed: 'Medicine information already enriched.',
  completed: 'Medicine enriched successfully.',
  needs_review: 'Could not confidently identify this medicine - flagged for review.',
  failed: 'Enrichment failed.',
};

/**
 * @desc    Enrich a single medicine's master information. Only fills fields
 *          that are currently empty, unless force=true (the "Refresh
 *          Information" action), which re-runs enrichment and overwrites the
 *          existing clinical fields with the newly returned ones.
 * @route   POST /api/medicine-catalog/:id/enrich
 * @access  Private (Admin)
 */
const enrichMedicine = asyncHandler(async (req, res) => {
  const force = req.body?.force === true || req.query.force === 'true';
  const result = await enrichmentService.enrichOneMedicine(req.params.id, { force });

  if (result.outcome === 'not_found') {
    throw new ApiError(404, 'Medicine not found in catalog');
  }

  res.status(200).json({
    success: true,
    message: OUTCOME_MESSAGES[result.outcome],
    data: { medicine: result.medicine, outcome: result.outcome },
  });
});

/**
 * @desc    Enrich every medicine whose enrichmentStatus is pending or failed.
 *          Fire-and-forget: processing continues in the background with
 *          limited concurrency; poll GET /enrichment-stats for progress.
 * @route   POST /api/medicine-catalog/enrich-all
 * @access  Private (Admin)
 */
const enrichAllMedicines = asyncHandler(async (req, res) => {
  const result = await enrichmentService.enrichAllMedicines({ statuses: ['pending', 'failed'] });

  if (!result.started) {
    throw new ApiError(409, result.reason);
  }

  res.status(202).json({
    success: true,
    message: `Enrichment started for ${result.queued} medicine(s).`,
    data: result,
  });
});

/**
 * @desc    Convenience wrapper: re-runs enrichment only for medicines whose
 *          enrichmentStatus is 'failed'.
 * @route   POST /api/medicine-catalog/retry-failed
 * @access  Private (Admin)
 */
const retryFailedMedicines = asyncHandler(async (req, res) => {
  const result = await enrichmentService.enrichAllMedicines({ statuses: ['failed'] });

  if (!result.started) {
    throw new ApiError(409, result.reason);
  }

  res.status(202).json({
    success: true,
    message: `Retrying ${result.queued} failed medicine(s).`,
    data: result,
  });
});

/**
 * @desc    Enrichment progress/summary stats, for the admin dashboard's
 *          "Medicine Data Management" section. Polled by the frontend while a
 *          bulk run is in progress.
 * @route   GET /api/medicine-catalog/enrichment-stats
 * @access  Private (Admin)
 */
const getEnrichmentStats = asyncHandler(async (req, res) => {
  const stats = await enrichmentService.getEnrichmentStats();
  res.status(200).json({
    success: true,
    data: { ...stats, aiConfigured: aiProvider.isConfigured(), aiModel: aiProvider.AI_MODEL },
  });
});

/**
 * @desc    List medicines currently flagged needs_review, for the admin
 *          review screen.
 * @route   GET /api/medicine-catalog/needs-review
 * @access  Private (Admin)
 */
const getNeedsReview = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const filter = { enrichmentStatus: 'needs_review' };
  const [medicines, total] = await Promise.all([
    MedicineCatalog.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum),
    MedicineCatalog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      medicines,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
    },
  });
});

/**
 * @desc    Admin approves the AI's proposed identification for a needs_review
 *          medicine - applies the stored proposal to the live fields.
 * @route   POST /api/medicine-catalog/:id/review/approve
 * @access  Private (Admin)
 */
const approveReview = asyncHandler(async (req, res) => {
  const medicine = await MedicineCatalog.findById(req.params.id);
  if (!medicine) {
    throw new ApiError(404, 'Medicine not found in catalog');
  }
  if (!medicine.enrichmentProposal) {
    throw new ApiError(400, 'No pending enrichment proposal to approve for this medicine');
  }

  const proposal = medicine.enrichmentProposal;
  const arrayToText = (value) => (Array.isArray(value) ? value.filter(Boolean).join('. ') || null : value || null);

  medicine.genericName = proposal.genericName || medicine.genericName;
  medicine.brandName = proposal.brandName || medicine.brandName;
  medicine.composition = arrayToText(proposal.composition) || medicine.composition;
  medicine.strength = proposal.strength || medicine.strength;
  medicine.dosageForm = proposal.dosageForm || medicine.dosageForm;
  medicine.description = proposal.description || medicine.description;
  medicine.uses = arrayToText(proposal.uses) || medicine.uses;
  medicine.howItWorks = proposal.howItWorks || medicine.howItWorks;
  medicine.sideEffects = arrayToText(proposal.sideEffects) || medicine.sideEffects;
  medicine.precautions = arrayToText(proposal.precautions) || medicine.precautions;
  medicine.contraindications = arrayToText(proposal.contraindications) || medicine.contraindications;
  medicine.storage = proposal.storage || medicine.storage;
  if (proposal.prescriptionRequired !== null && proposal.prescriptionRequired !== undefined) {
    medicine.prescriptionRequired = proposal.prescriptionRequired;
  }

  medicine.enrichmentStatus = 'completed';
  medicine.enrichmentConfidence = proposal.confidence ?? medicine.enrichmentConfidence;
  medicine.informationSource = `${aiProvider.AI_MODEL ? `ai:${aiProvider.AI_MODEL}` : 'ai'} (admin-approved)`;
  medicine.needsReview = false;
  medicine.enrichmentError = '';
  medicine.enrichmentProposal = null;
  medicine.lastEnrichedAt = new Date();
  await medicine.save();

  res.status(200).json({
    success: true,
    message: 'Enrichment proposal approved and applied.',
    data: { medicine },
  });
});

/**
 * @desc    Admin corrects a medicine's name (e.g. it was misidentified or the
 *          CSV name was ambiguous), then immediately re-runs enrichment using
 *          the corrected name.
 * @route   PATCH /api/medicine-catalog/:id/review/name
 * @access  Private (Admin)
 */
const updateMedicineNameAndRetry = asyncHandler(async (req, res) => {
  const medicine = await MedicineCatalog.findById(req.params.id);
  if (!medicine) {
    throw new ApiError(404, 'Medicine not found in catalog');
  }

  medicine.name = req.body.name;
  medicine.enrichmentStatus = 'pending';
  medicine.needsReview = false;
  medicine.enrichmentProposal = null;
  await medicine.save();

  const result = await enrichmentService.enrichOneMedicine(medicine._id, { force: true });

  res.status(200).json({
    success: true,
    message: `Medicine name updated. ${OUTCOME_MESSAGES[result.outcome] || ''}`.trim(),
    data: { medicine: result.medicine, outcome: result.outcome },
  });
});

module.exports = {
  enrichMedicine,
  enrichAllMedicines,
  retryFailedMedicines,
  getEnrichmentStats,
  getNeedsReview,
  approveReview,
  updateMedicineNameAndRetry,
};
