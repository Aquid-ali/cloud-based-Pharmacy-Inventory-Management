const { body, param, query } = require('express-validator');

const createInventoryValidator = [
  // pharmacyId is intentionally not accepted here - the controller always derives it
  // from the authenticated admin (req.user.pharmacyId), never from client input.
  body('medicineId').isMongoId().withMessage('A valid medicineId is required'),
  body('batchNumber').trim().notEmpty().withMessage('Batch number is required'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a non-negative number'),
  body('purchasePrice')
    .notEmpty()
    .withMessage('Purchase price is required')
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a non-negative number'),
  body('sellingPrice')
    .notEmpty()
    .withMessage('Selling price is required')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a non-negative number'),
  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  body('minimumStock')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum stock must be a non-negative number'),
];

const updateInventoryValidator = [
  param('id').isMongoId().withMessage('Invalid inventory item id'),
  body('batchNumber').optional().trim().notEmpty().withMessage('Batch number cannot be empty'),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('purchasePrice').optional().isFloat({ min: 0 }).withMessage('Purchase price must be a non-negative number'),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),
  body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
  body('minimumStock').optional().isFloat({ min: 0 }).withMessage('Minimum stock must be a non-negative number'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid inventory item id')];

const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  // pharmacyId is not accepted as a query filter - results are always scoped to the
  // authenticated admin's own pharmacy (see inventoryController.getOwnPharmacyId).
  query('medicineId').optional().isMongoId().withMessage('Invalid medicineId'),
  query('status').optional().isIn(['In Stock', 'Low Stock', 'Out of Stock', 'Expired']),
  query('expiry').optional().isIn(['expired', 'expiringSoon', 'valid']),
];

module.exports = {
  createInventoryValidator,
  updateInventoryValidator,
  idParamValidator,
  listQueryValidator,
};
