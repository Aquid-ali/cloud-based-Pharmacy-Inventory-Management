const { body } = require('express-validator');

const createSaleValidator = [
  body('items').isArray({ min: 1 }).withMessage('Sale must contain at least one item'),
  body('items.*.medicineId').isMongoId().withMessage('Each item needs a valid medicineId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
  body('paymentMethod').isIn(['Cash', 'UPI', 'Card']).withMessage('paymentMethod must be Cash, UPI or Card'),
  body('customerName').optional().trim().isLength({ max: 100 }).withMessage('customerName is too long'),
];

module.exports = { createSaleValidator };
