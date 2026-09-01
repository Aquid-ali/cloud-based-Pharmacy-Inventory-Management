const { body, param, query } = require('express-validator');

const createPharmacyValidator = [
  body('name').trim().notEmpty().withMessage('Pharmacy name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').trim().notEmpty().withMessage('Pincode is required'),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

const updatePharmacyValidator = [
  param('id').isMongoId().withMessage('Invalid pharmacy id'),
  body('name').optional().trim().notEmpty().withMessage('Pharmacy name cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  body('pincode').optional().trim().notEmpty().withMessage('Pincode cannot be empty'),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid pharmacy id')];

const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive']),
];

const nearbyQueryValidator = [
  query('lat').isFloat().withMessage('lat is required'),
  query('lng').isFloat().withMessage('lng is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

const browseInventoryQueryValidator = [
  query('pharmacyId').optional().isMongoId().withMessage('Invalid pharmacyId'),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

module.exports = {
  createPharmacyValidator,
  updatePharmacyValidator,
  idParamValidator,
  listQueryValidator,
  nearbyQueryValidator,
  browseInventoryQueryValidator,
};
