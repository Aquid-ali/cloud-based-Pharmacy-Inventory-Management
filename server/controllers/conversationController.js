const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { isParticipant } = require('../services/conversationAuth');
const { UPLOAD_DIR } = require('../middleware/chatUploadMiddleware');

const PREVIEW_LENGTH = 140;

const previewFor = (text, attachmentCount) => {
  if (text?.trim()) {
    return text.trim().length > PREVIEW_LENGTH ? `${text.trim().slice(0, PREVIEW_LENGTH)}…` : text.trim();
  }
  return attachmentCount === 1 ? '📷 Photo' : `📷 ${attachmentCount} photos`;
};

/**
 * @desc    Find or create the one conversation between the signed-in customer
 *          and a pharmacy - relies on Conversation's unique (customerId,
 *          pharmacyId) index so this can never produce a duplicate even
 *          under a race (the second concurrent create just hits the unique
 *          index and this catches it).
 * @route   POST /api/conversations
 * @access  Private (Customer)
 */
const createOrGetConversation = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Customer') {
    throw new ApiError(403, 'Only customers can start a conversation');
  }

  const { pharmacyId } = req.body;
  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId, status: 'active' });
  if (!pharmacy) {
    throw new ApiError(404, 'Pharmacy not found');
  }

  let conversation = await Conversation.findOne({ customerId: req.user._id, pharmacyId });
  let created = false;

  if (!conversation) {
    try {
      conversation = await Conversation.create({ customerId: req.user._id, pharmacyId });
      created = true;
    } catch (error) {
      if (error.code === 11000) {
        conversation = await Conversation.findOne({ customerId: req.user._id, pharmacyId });
      } else {
        throw error;
      }
    }
  }

  res.status(created ? 201 : 200).json({ success: true, data: { conversation } });
});

/**
 * @desc    The signed-in customer's conversations, newest activity first
 * @route   GET /api/conversations/customer
 * @access  Private (Customer)
 */
const getCustomerConversations = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Customer') {
    throw new ApiError(403, 'Only customers can view their conversation list this way');
  }

  const conversations = await Conversation.find({ customerId: req.user._id })
    .sort({ lastMessageAt: -1 })
    .populate('pharmacyId', 'name city state');

  res.status(200).json({ success: true, data: { conversations } });
});

/**
 * @desc    The signed-in pharmacy admin's conversations, newest activity first.
 *          Customer fields are limited to what's already surfaced elsewhere in
 *          the app (name/email/phone) - never addresses or other data.
 * @route   GET /api/conversations/pharmacy
 * @access  Private (Admin, pharmacy-scoped only)
 */
const getPharmacyConversations = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin' || !req.user.pharmacyId) {
    throw new ApiError(403, 'Only pharmacy admins can view their conversation list this way');
  }

  const pharmacyId = req.user.pharmacyId._id || req.user.pharmacyId;
  const conversations = await Conversation.find({ pharmacyId })
    .sort({ lastMessageAt: -1 })
    .populate('customerId', 'fullName email phone');

  res.status(200).json({ success: true, data: { conversations } });
});

/**
 * @desc    Total unread count across all of the signed-in user's
 *          conversations - powers the nav badge (polled periodically by the
 *          client, no push infrastructure needed).
 * @route   GET /api/conversations/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  let filter;
  let field;
  if (req.user.role === 'Customer') {
    filter = { customerId: req.user._id };
    field = 'customerUnreadCount';
  } else if (req.user.role === 'Admin' && req.user.pharmacyId) {
    filter = { pharmacyId: req.user.pharmacyId._id || req.user.pharmacyId };
    field = 'pharmacyUnreadCount';
  } else {
    return res.status(200).json({ success: true, data: { unreadCount: 0 } });
  }

  const conversations = await Conversation.find(filter, { [field]: 1 }).lean();
  const unreadCount = conversations.reduce((sum, c) => sum + (c[field] || 0), 0);

  res.status(200).json({ success: true, data: { unreadCount } });
});

/**
 * @desc    A conversation's messages, newest-first cursor pagination -
 *          returns the page in chronological order for direct rendering.
 * @route   GET /api/conversations/:id/messages?limit=30&before=<messageId>
 * @access  Private (participant only)
 */
const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  if (!isParticipant(conversation, req.user)) {
    throw new ApiError(403, 'You are not authorized to view this conversation');
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);
  const filter = { conversationId: conversation._id };

  if (req.query.before) {
    const cursor = await Message.findById(req.query.before, { createdAt: 1 });
    if (cursor) filter.createdAt = { $lt: cursor.createdAt };
  }

  const page = await Message.find(filter).sort({ createdAt: -1 }).limit(limit);
  const messages = page.reverse();
  const hasMore = page.length === limit;

  res.status(200).json({ success: true, data: { messages, hasMore } });
});

/**
 * @desc    Send a message (text and/or up to 5 images) - updates the
 *          conversation's preview/unread counters in the same request.
 * @route   POST /api/conversations/:id/messages
 * @access  Private (participant only)
 */
const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  if (!isParticipant(conversation, req.user)) {
    throw new ApiError(403, 'You are not authorized to send messages in this conversation');
  }

  const text = (req.body.text || '').trim();
  const files = req.files || [];

  if (!text && files.length === 0) {
    throw new ApiError(400, 'A message must contain text or at least one image');
  }

  const attachments = files.map((file) => ({
    url: `/api/conversations/${conversation._id}/attachments/${file.filename}`,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
  }));

  const messageType = attachments.length > 0 ? (text ? 'IMAGE_WITH_TEXT' : 'IMAGE') : 'TEXT';

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.user._id,
    senderRole: req.user.role,
    messageType,
    text,
    attachments,
  });

  const isCustomer = req.user.role === 'Customer';
  conversation.lastMessageText = previewFor(text, attachments.length);
  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessageSenderRole = req.user.role;
  // The recipient's unread count goes up; the sender has obviously seen the
  // thread up to this point, so their own count resets (the explicit "mark
  // read" endpoint remains the primary mechanism for opening a conversation).
  if (isCustomer) {
    conversation.pharmacyUnreadCount += 1;
    conversation.customerUnreadCount = 0;
  } else {
    conversation.customerUnreadCount += 1;
    conversation.pharmacyUnreadCount = 0;
  }
  await conversation.save();

  res.status(201).json({ success: true, data: { message } });
});

/**
 * @desc    Marks a conversation as read for the caller - zeroes their unread
 *          count and stamps readAt on the other party's unread messages.
 * @route   PATCH /api/conversations/:id/read
 * @access  Private (participant only)
 */
const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  if (!isParticipant(conversation, req.user)) {
    throw new ApiError(403, 'You are not authorized to view this conversation');
  }

  const isCustomer = req.user.role === 'Customer';
  const otherRole = isCustomer ? 'Admin' : 'Customer';

  if (isCustomer) {
    conversation.customerUnreadCount = 0;
  } else {
    conversation.pharmacyUnreadCount = 0;
  }
  await conversation.save();

  await Message.updateMany(
    { conversationId: conversation._id, senderRole: otherRole, readAt: null },
    { $set: { readAt: new Date() } }
  );

  res.status(200).json({ success: true, data: { conversation } });
});

/**
 * @desc    Streams a chat attachment. Authenticated via a query-string token
 *          rather than the Authorization header, since a plain <img src> URL
 *          can't attach custom headers - still requires a valid JWT and a
 *          real participant match, so this is genuine per-conversation
 *          authorization, not just an unguessable filename.
 * @route   GET /api/conversations/:id/attachments/:filename
 * @access  Private (participant only, via ?token=)
 */
const getAttachment = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Not authorized, token failed or expired');
  }

  const user = await User.findById(decoded.id).populate('pharmacyId');
  if (!user) {
    throw new ApiError(401, 'Not authorized, user no longer exists');
  }

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  if (!isParticipant(conversation, user)) {
    throw new ApiError(403, 'You are not authorized to view this attachment');
  }

  // path.basename strips any directory-traversal attempt before it ever
  // reaches the filesystem; the DB check below confirms this exact file is
  // actually one of this conversation's own attachments, not just any file
  // that happens to sit in the shared upload directory.
  const safeName = path.basename(req.params.filename);
  const belongsToConversation = await Message.exists({
    conversationId: conversation._id,
    'attachments.filename': safeName,
  });
  if (!belongsToConversation) {
    throw new ApiError(404, 'Attachment not found');
  }

  const filePath = path.join(UPLOAD_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Attachment not found');
  }

  res.sendFile(filePath);
});

module.exports = {
  createOrGetConversation,
  getCustomerConversations,
  getPharmacyConversations,
  getUnreadCount,
  getMessages,
  sendMessage,
  markConversationRead,
  getAttachment,
};
