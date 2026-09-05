const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  createOrGetConversation,
  getCustomerConversations,
  getPharmacyConversations,
  getUnreadCount,
  getMessages,
  sendMessage,
  markConversationRead,
  getAttachment,
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { uploadChatImages } = require('../middleware/chatUploadMiddleware');
const {
  createConversationValidator,
  conversationIdParamValidator,
  getMessagesQueryValidator,
  sendMessageValidator,
} = require('../validators/conversationValidator');

// Attachments authenticate via ?token= inside the controller (a plain
// <img src> can't send an Authorization header) - declared before
// router.use(protect) so it isn't also gated by the header-based check.
router.get('/:id/attachments/:filename', conversationIdParamValidator, validate, getAttachment);

// Every other conversation route requires the normal header-based auth.
router.use(protect);

router.post('/', createConversationValidator, validate, createOrGetConversation);
router.get('/customer', getCustomerConversations);
router.get('/pharmacy', getPharmacyConversations);
router.get('/unread-count', getUnreadCount);

router.get('/:id/messages', getMessagesQueryValidator, validate, getMessages);

const sendMessageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent - please slow down and try again shortly.' },
});

router.post(
  '/:id/messages',
  sendMessageLimiter,
  uploadChatImages,
  sendMessageValidator,
  validate,
  sendMessage
);

router.patch('/:id/read', conversationIdParamValidator, validate, markConversationRead);

module.exports = router;
