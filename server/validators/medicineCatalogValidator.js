const { body, param, query } = require('express-validator');

const reviewStatField = (field) =>
  body(field).optional().isFloat({ min: 0, max: 100 }).withMessage(`${field} must be between 0 and 100`);

const createMedicineValidator = [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('composition').trim().notEmpty().withMessage('Composition is required'),
  body('manufacturer').trim().notEmpty().withMessage('Manufacturer is required'),
  body('uses').optional().trim(),
  body('sideEffects').optional().trim(),
  body('imageUrl').optional().trim(),
  reviewStatField('reviewStats.excellent'),
  reviewStatField('reviewStats.average'),
  reviewStatField('reviewStats.poor'),
];

const updateMedicineValidator = [
  param('id').isMongoId().withMessage('Invalid medicine id'),
  body('name').optional().trim().notEmpty().withMessage('Medicine name cannot be empty'),
  body('composition').optional().trim().notEmpty().withMessage('Composition cannot be empty'),
  body('manufacturer').optional().trim().notEmpty().withMessage('Manufacturer cannot be empty'),
  body('uses').optional().trim(),
  body('sideEffects').optional().trim(),
  body('imageUrl').optional().trim(),
  reviewStatField('reviewStats.excellent'),
  reviewStatField('reviewStats.average'),
  reviewStatField('reviewStats.poor'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid medicine id')];

const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('manufacturer').optional().trim(),
];

const searchQueryValidator = [
  query('q').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

module.exports = {
  createMedicineValidator,
  updateMedicineValidator,
  idParamValidator,
  listQueryValidator,
  searchQueryValidator,
};
