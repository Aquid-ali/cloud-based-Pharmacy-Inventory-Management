const express = require('express');
const router = express.Router();

const { getStores, getNearbyStores } = require('../controllers/storeController');
const { protect } = require('../middleware/authMiddleware');

// All store routes require authentication
router.use(protect);

router.get('/nearby', getNearbyStores);
router.get('/', getStores);

module.exports = router;
