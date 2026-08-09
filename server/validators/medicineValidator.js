const { body, param, query } = require('express-validator');

const createMedicineValidator = [
  body('medicineName').trim().notEmpty().withMessage('Medicine name is required'),
  body('manufacturer').trim().notEmpty().withMessage('Manufacturer is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('batchNumber').trim().notEmpty().withMessage('Batch number is required'),
  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  body('manufacturingDate')
    .optional()
    .isISO8601()
    .withMessage('Manufacturing date must be a valid date'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a non-negative number'),
  body('buyingPrice')
    .notEmpty()
    .withMessage('Buying price is required')
    .isFloat({ min: 0 })
    .withMessage('Buying price must be a non-negative number'),
  body('sellingPrice')
    .notEmpty()
    .withMessage('Selling price is required')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a non-negative number'),
  body('supplier').optional().trim(),
  body('description').optional().trim().isLength({ max: 1000 }),
];

const updateMedicineValidator = [
  param('id').isMongoId().withMessage('Invalid medicine id'),
  body('medicineName').optional().trim().notEmpty().withMessage('Medicine name cannot be empty'),
  body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
  body('manufacturingDate').optional().isISO8601().withMessage('Manufacturing date must be a valid date'),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('buyingPrice').optional().isFloat({ min: 0 }).withMessage('Buying price must be a non-negative number'),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid medicine id')];

const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['medicineName', 'expiryDate', 'quantity', 'createdAt']),
  query('order').optional().isIn(['asc', 'desc']),
];

module.exports = {
  createMedicineValidator,
  updateMedicineValidator,
  idParamValidator,
  listQueryValidator,
};
