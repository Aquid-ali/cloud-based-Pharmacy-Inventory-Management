const { body, param, query } = require('express-validator');

const idParamValidator = [param('id').isMongoId().withMessage('Invalid medicine id')];

const enrichValidator = [
  param('id').isMongoId().withMessage('Invalid medicine id'),
  body('force').optional().isBoolean().withMessage('force must be a boolean'),
];

const updateNameValidator = [
  param('id').isMongoId().withMessage('Invalid medicine id'),
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
];

const needsReviewQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

module.exports = { idParamValidator, enrichValidator, updateNameValidator, needsReviewQueryValidator };
