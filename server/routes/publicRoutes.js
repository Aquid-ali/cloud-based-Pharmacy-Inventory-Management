const express = require('express');
const router = express.Router();

const { getPublicStats, getPublicPharmacies } = require('../controllers/publicController');

// Intentionally has no `protect` middleware - these are non-sensitive
// aggregate counts meant for the public landing page, visible before login.
router.get('/stats', getPublicStats);

// Also public - a small preview of real active pharmacies (name + location
// only) for the landing page's discovery section. See controller for the
// exact field allowlist.
router.get('/pharmacies', getPublicPharmacies);

module.exports = router;
