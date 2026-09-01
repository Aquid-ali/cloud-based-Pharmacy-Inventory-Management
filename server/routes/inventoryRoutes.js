const express = require('express');
const router = express.Router();

const {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  getDashboardStats,
} = require('../controllers/inventoryController');

const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createInventoryValidator,
  updateInventoryValidator,
  idParamValidator,
  listQueryValidator,
} = require('../validators/inventoryValidator');

// All inventory routes require authentication. Inventory (including purchase price)
// is internal, pharmacy-admin-only data - customers get availability via the
// separate, storefront-safe /api/medicine-catalog/:id/availability endpoint instead.
router.use(protect);
router.use(authorize('Admin'));

// Must be declared before '/:id' so it isn't captured as an id param
router.get('/stats/summary', getDashboardStats);

router
  .route('/')
  .get(listQueryValidator, validate, getInventoryItems)
  .post(createInventoryValidator, validate, createInventoryItem);

router
  .route('/:id')
  .get(idParamValidator, validate, getInventoryItemById)
  .put(updateInventoryValidator, validate, updateInventoryItem)
  .delete(idParamValidator, validate, deleteInventoryItem);

module.exports = router;
