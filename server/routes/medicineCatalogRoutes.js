const express = require('express');
const router = express.Router();

const {
  createMedicine,
  getMedicines,
  searchMedicines,
  getMedicineById,
  getMedicineAvailability,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineCatalogController');
const {
  enrichMedicine,
  enrichAllMedicines,
  retryFailedMedicines,
  getEnrichmentStats,
  getNeedsReview,
  approveReview,
  updateMedicineNameAndRetry,
} = require('../controllers/medicineEnrichmentController');

const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createMedicineValidator,
  updateMedicineValidator,
  idParamValidator,
  listQueryValidator,
  searchQueryValidator,
} = require('../validators/medicineCatalogValidator');
const {
  idParamValidator: enrichmentIdParamValidator,
  enrichValidator,
  updateNameValidator,
  needsReviewQueryValidator,
} = require('../validators/medicineEnrichmentValidator');

// Public read-only catalog browsing - the customer-facing medicine catalog
// (search, detail, pharmacy availability) needs to be visible to anonymous
// visitors from the public landing page, not just signed-in Customers.
// Everything else (mutations, AI enrichment, admin-only listings) still
// requires `protect` below. `/search` must stay declared before '/:id' so
// that single-segment static path isn't captured as an id param.
router.get('/search', searchQueryValidator, validate, searchMedicines);
router.post('/enrich-all', protect, authorize('Admin'), enrichAllMedicines);
router.post('/retry-failed', protect, authorize('Admin'), retryFailedMedicines);
router.get('/enrichment-stats', protect, authorize('Admin'), getEnrichmentStats);
router.get('/needs-review', protect, authorize('Admin'), needsReviewQueryValidator, validate, getNeedsReview);

router
  .route('/')
  .get(protect, listQueryValidator, validate, getMedicines)
  .post(protect, authorize('Admin'), createMedicineValidator, validate, createMedicine);

// Also public - same reasoning as '/search' above.
router.get('/:id', idParamValidator, validate, getMedicineById);
router.get('/:id/availability', idParamValidator, validate, getMedicineAvailability);

router
  .route('/:id')
  .put(protect, authorize('Admin'), updateMedicineValidator, validate, updateMedicine)
  .delete(protect, authorize('Admin'), idParamValidator, validate, deleteMedicine);

// AI enrichment (Admin only - see section 17 of the feature spec: only
// authorized Admins may trigger AI/API calls, and all such calls happen
// server-side here, never from the frontend).
router.post('/:id/enrich', protect, authorize('Admin'), enrichValidator, validate, enrichMedicine);
router.post('/:id/review/approve', protect, authorize('Admin'), enrichmentIdParamValidator, validate, approveReview);
router.patch('/:id/review/name', protect, authorize('Admin'), updateNameValidator, validate, updateMedicineNameAndRetry);

module.exports = router;
