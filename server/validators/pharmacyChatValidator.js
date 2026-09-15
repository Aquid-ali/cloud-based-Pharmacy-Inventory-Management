const { body, param, query } = require('express-validator');

const conversationIdParamValidator = [param('id').isMongoId().withMessage('Invalid conversation id')];

const getMessagesQueryValidator = [
  param('id').isMongoId().withMessage('Invalid conversation id'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('before').optional().isMongoId().withMessage('Invalid before cursor'),
];

const sendMessageValidator = [
  param('id').isMongoId().withMessage('Invalid conversation id'),
  body('text').optional().trim().isLength({ max: 2000 }).withMessage('Message text is too long'),
  body('productRequest.inventoryId').optional().isMongoId().withMessage('Invalid inventory item'),
  body('productRequest.quantityRequested').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('productRequest.note').optional().trim().isLength({ max: 500 }).withMessage('Note is too long'),
];

const deleteMessageParamValidator = [
  param('id').isMongoId().withMessage('Invalid conversation id'),
  param('messageId').isMongoId().withMessage('Invalid message id'),
];

module.exports = {
  conversationIdParamValidator,
  getMessagesQueryValidator,
  sendMessageValidator,
  deleteMessageParamValidator,
};
