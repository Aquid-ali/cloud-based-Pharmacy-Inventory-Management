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

// All pharmacy routes require authentication
router.use(protect);

// Must be declared before '/:id' so these aren't captured as an id param
router.get('/nearby', nearbyQueryValidator, validate, getNearbyPharmacies);
router.get('/browse-inventory', browseInventoryQueryValidator, validate, browsePharmacyInventory);

router
  .route('/')
  .get(listQueryValidator, validate, getPharmacies)
  .post(authorize('Admin'), createPharmacyValidator, validate, createPharmacy);

router
  .route('/:id')
  .get(idParamValidator, validate, getPharmacyById)
  .put(authorize('Admin'), updatePharmacyValidator, validate, updatePharmacy)
  .delete(authorize('Admin'), idParamValidator, validate, deletePharmacy);

module.exports = router;
