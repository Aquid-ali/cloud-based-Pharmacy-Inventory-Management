const express = require('express');
const router = express.Router();

const { getPublicStats } = require('../controllers/publicController');

// Intentionally has no `protect` middleware - these are non-sensitive
// aggregate counts meant for the public landing page, visible before login.
router.get('/stats', getPublicStats);

module.exports = router;
