const { param, query } = require('express-validator');

const discoverQueryValidator = [
  query('search').optional().trim(),
  query('city').optional().trim(),
  query('state').optional().trim(),
  query('verified').optional().isIn(['true', 'false']).withMessage('verified must be true or false'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

const pharmacyIdParamValidator = [param('id').isMongoId().withMessage('Invalid pharmacy id')];

module.exports = { discoverQueryValidator, pharmacyIdParamValidator };
