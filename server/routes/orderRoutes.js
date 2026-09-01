const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getStoreOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createOrderValidator,
  idParamValidator,
  updateOrderStatusValidator,
} = require('../validators/orderValidator');

// All order routes require authentication
router.use(protect);

router.post('/', authorize('Customer'), createOrderValidator, validate, createOrder);
router.get('/mine', authorize('Customer'), getMyOrders);
router.get('/', authorize('Admin'), getStoreOrders);
router.patch('/:id/status', authorize('Admin'), updateOrderStatusValidator, validate, updateOrderStatus);
router.get('/:id', idParamValidator, validate, getOrderById);

module.exports = router;
