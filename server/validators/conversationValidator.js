const { body, param, query } = require('express-validator');

const createConversationValidator = [
  body('pharmacyId').isMongoId().withMessage('A valid pharmacyId is required'),
];

const conversationIdParamValidator = [param('id').isMongoId().withMessage('Invalid conversation id')];

const getMessagesQueryValidator = [
  param('id').isMongoId().withMessage('Invalid conversation id'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('before').optional().isMongoId().withMessage('Invalid before cursor'),
];

const sendMessageValidator = [
  param('id').isMongoId().withMessage('Invalid conversation id'),
  body('text').optional().trim().isLength({ max: 2000 }).withMessage('Message text is too long'),
];

module.exports = {
  createConversationValidator,
  conversationIdParamValidator,
  getMessagesQueryValidator,
  sendMessageValidator,
};
