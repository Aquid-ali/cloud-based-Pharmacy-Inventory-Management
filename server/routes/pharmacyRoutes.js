const express = require('express');
const router = express.Router();

const {
  createPharmacy,
  getPharmacies,
  getNearbyPharmacies,
  browsePharmacyInventory,
  getPharmacyById,
  updatePharmacy,
  deletePharmacy,
  uploadUpiQrCode,
  deleteUpiQrCode,
  getPharmacyQrCode,
} = require('../controllers/pharmacyController');

const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createPharmacyValidator,
  updatePharmacyValidator,
  idParamValidator,
  listQueryValidator,
  nearbyQueryValidator,
  browseInventoryQueryValidator,
} = require('../validators/pharmacyValidator');
const { uploadQrCode } = require('../middleware/qrCodeUploadMiddleware');

// All pharmacy routes require authentication
router.use(protect);

// Must be declared before '/:id' so these aren't captured as an id param
router.get('/nearby', nearbyQueryValidator, validate, getNearbyPharmacies);
router.get('/browse-inventory', browseInventoryQueryValidator, validate, browsePharmacyInventory);

router
  .route('/')
  .get(listQueryValidator, validate, getPharmacies)
  .post(authorize('Admin'), createPharmacyValidator, validate, createPharmacy);

// QR code management (must be before generic /:id to avoid capture)
router
  .route('/:id/qr-code')
  .get(idParamValidator, validate, getPharmacyQrCode)
  .post(authorize('Admin'), idParamValidator, validate, uploadQrCode.single('qrCode'), uploadUpiQrCode)
  .delete(authorize('Admin'), idParamValidator, validate, deleteUpiQrCode);

router
  .route('/:id')
  .get(idParamValidator, validate, getPharmacyById)
  .put(authorize('Admin'), updatePharmacyValidator, validate, updatePharmacy)
  .delete(authorize('Admin'), idParamValidator, validate, deletePharmacy);

module.exports = router;

