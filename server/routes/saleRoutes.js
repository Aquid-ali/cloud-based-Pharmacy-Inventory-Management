const express = require('express');
const router = express.Router();

const { createSale, getSales, getSalesStats } = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createSaleValidator } = require('../validators/saleValidator');

// All sale routes require authentication and an Admin (a counter/POS sale is
// always recorded by staff, never a customer).
router.use(protect);
router.use(authorize('Admin'));

// Must be declared before any '/:id' route so it isn't captured as an id param
router.get('/stats/summary', getSalesStats);

router.post('/', createSaleValidator, validate, createSale);
router.get('/', getSales);

module.exports = router;
