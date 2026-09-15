const express = require('express');
const router = express.Router();

const { discoverPharmacies, getPharmacyProfile } = require('../controllers/pharmacyDiscoveryController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { discoverQueryValidator, pharmacyIdParamValidator } = require('../validators/pharmacyDiscoveryValidator');

router.use(protect);

router.get('/pharmacies', discoverQueryValidator, validate, discoverPharmacies);
router.get('/pharmacies/:id', pharmacyIdParamValidator, validate, getPharmacyProfile);

module.exports = router;
