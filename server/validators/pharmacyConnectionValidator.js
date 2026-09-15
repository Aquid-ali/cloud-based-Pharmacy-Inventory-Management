const { body, param, query } = require('express-validator');

const sendRequestValidator = [body('pharmacyId').isMongoId().withMessage('A valid pharmacyId is required')];

const listConnectionsQueryValidator = [
  query('status').optional().isIn(['pending', 'accepted', 'declined', 'blocked']),
  query('direction').optional().isIn(['incoming', 'outgoing']),
];

const connectionIdParamValidator = [param('id').isMongoId().withMessage('Invalid connection id')];

module.exports = { sendRequestValidator, listConnectionsQueryValidator, connectionIdParamValidator };
