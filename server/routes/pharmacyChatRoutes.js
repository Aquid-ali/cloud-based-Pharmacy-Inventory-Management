const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  getMyPharmacyConversations,
  getUnreadSummary,
  getMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
  getAttachment,
} = require('../controllers/pharmacyChatController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { uploadPharmacyChatImages } = require('../middleware/pharmacyChatUploadMiddleware');
const {
  conversationIdParamValidator,
  getMessagesQueryValidator,
  sendMessageValidator,
  deleteMessageParamValidator,
} = require('../validators/pharmacyChatValidator');

// Attachments authenticate via ?token= inside the controller (a plain
// <img src> can't send an Authorization header) - declared before
// router.use(protect) so it isn't also gated by the header-based check.
router.get('/conversations/:id/attachments/:filename', conversationIdParamValidator, validate, getAttachment);

router.use(protect);

router.get('/conversations', getMyPharmacyConversations);
router.get('/unread-count', getUnreadSummary);

router.get('/conversations/:id/messages', getMessagesQueryValidator, validate, getMessages);

const sendMessageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent - please slow down and try again shortly.' },
});

// uploadPharmacyChatImages only activates for multipart/form-data requests
// (text + up to 5 images); a plain JSON { productRequest } body passes
// through untouched, so one route serves both message shapes.
router.post(
  '/conversations/:id/messages',
  sendMessageLimiter,
  uploadPharmacyChatImages,
  sendMessageValidator,
  validate,
  sendMessage
);

router.patch('/conversations/:id/read', conversationIdParamValidator, validate, markConversationRead);
router.delete('/conversations/:id/messages/:messageId', deleteMessageParamValidator, validate, deleteMessage);

module.exports = router;
