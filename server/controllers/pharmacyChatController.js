const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const PharmacyConversation = require('../models/PharmacyConversation');
const PharmacyMessage = require('../models/PharmacyMessage');
const PharmacyConnection = require('../models/PharmacyConnection');
const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { getOwnPharmacyId, isParticipant, otherPharmacyId } = require('../services/pharmacyNetworkAuth');
const { UPLOAD_DIR } = require('../middleware/pharmacyChatUploadMiddleware');

const PREVIEW_LENGTH = 140;
const OTHER_PHARMACY_FIELDS = 'name city state isVerified status';

const previewFor = (message) => {
  if (message.messageType === 'PRODUCT_REQUEST') {
    return `📦 Product request: ${message.productRequest.medicineName} x${message.productRequest.quantityRequested}`;
  }
  if (message.text?.trim()) {
    return message.text.trim().length > PREVIEW_LENGTH
      ? `${message.text.trim().slice(0, PREVIEW_LENGTH)}…`
      : message.text.trim();
  }
  return message.attachments.length === 1 ? '📷 Photo' : `📷 ${message.attachments.length} photos`;
};

// Deleted messages never leave the server with their real content - the
// redaction happens here, on every read path, not just in the UI.
const redactMessage = (message) => {
  const obj = message.toJSON ? message.toJSON() : message;
  if (!obj.deletedAt) return obj;
  return { ...obj, text: '', attachments: [], productRequest: null };
};

const loadConversationForParticipant = async (conversationId, myPharmacyId) => {
  const conversation = await PharmacyConversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  if (!isParticipant(conversation, myPharmacyId)) {
    throw new ApiError(403, 'You are not authorized to view this conversation');
  }
  return conversation;
};

/**
 * @desc    The signed-in pharmacy's B2B conversations, newest activity first.
 * @route   GET /api/pharmacy-network/conversations
 * @access  Private (Admin, pharmacy-scoped)
 */
const getMyPharmacyConversations = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);

  const conversations = await PharmacyConversation.find({
    $or: [{ pharmacyLow: myPharmacyId }, { pharmacyHigh: myPharmacyId }],
  }).sort({ lastMessageAt: -1 });

  const otherIds = conversations.map((c) => otherPharmacyId(c, myPharmacyId));
  const others = await Pharmacy.find({ _id: { $in: otherIds } }, OTHER_PHARMACY_FIELDS).lean();
  const othersById = new Map(others.map((p) => [String(p._id), p]));

  const connectionIds = conversations.map((c) => c.connectionId);
  const connections = await PharmacyConnection.find({ _id: { $in: connectionIds } }, { status: 1, blockedBy: 1 }).lean();
  const connectionsById = new Map(connections.map((c) => [String(c._id), c]));

  const result = conversations.map((c) => {
    const unreadField = c.unreadFieldFor(myPharmacyId);
    const connection = connectionsById.get(String(c.connectionId));
    return {
      _id: c._id,
      otherPharmacy: othersById.get(otherPharmacyId(c, myPharmacyId)) || null,
      lastMessageText: c.lastMessageText,
      lastMessageAt: c.lastMessageAt,
      unread: c[unreadField],
      blocked: connection?.status === 'blocked',
      blockedByMe: connection?.status === 'blocked' && String(connection.blockedBy) === String(myPharmacyId),
    };
  });

  res.status(200).json({ success: true, data: { conversations: result } });
});

/**
 * @desc    Combined unread-message + pending-incoming-request count - powers
 *          the single "Pharmacy Network" sidebar badge.
 * @route   GET /api/pharmacy-network/unread-count
 * @access  Private (Admin, pharmacy-scoped)
 */
const getUnreadSummary = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);

  const conversations = await PharmacyConversation.find(
    { $or: [{ pharmacyLow: myPharmacyId }, { pharmacyHigh: myPharmacyId }] },
    { pharmacyLow: 1, pharmacyHigh: 1, unreadCountLow: 1, unreadCountHigh: 1 }
  ).lean();
  const messageUnreadCount = conversations.reduce((sum, c) => {
    const field = String(c.pharmacyLow) === String(myPharmacyId) ? 'unreadCountLow' : 'unreadCountHigh';
    return sum + (c[field] || 0);
  }, 0);

  const pending = await PharmacyConnection.find(
    { $or: [{ pharmacyLow: myPharmacyId }, { pharmacyHigh: myPharmacyId }], status: 'pending' },
    { requestedBy: 1 }
  ).lean();
  const pendingRequestCount = pending.filter((c) => String(c.requestedBy) !== String(myPharmacyId)).length;

  res.status(200).json({
    success: true,
    data: { messageUnreadCount, pendingRequestCount, total: messageUnreadCount + pendingRequestCount },
  });
});

/**
 * @desc    A conversation's messages, newest-first cursor pagination -
 *          returns the page in chronological order for direct rendering.
 *          Soft-deleted messages are redacted before they ever leave here.
 * @route   GET /api/pharmacy-network/conversations/:id/messages?limit=&before=
 * @access  Private (Admin, pharmacy-scoped participant only)
 */
const getMessages = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const conversation = await loadConversationForParticipant(req.params.id, myPharmacyId);

  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);
  const filter = { conversationId: conversation._id };

  if (req.query.before) {
    const cursor = await PharmacyMessage.findById(req.query.before, { createdAt: 1 });
    if (cursor) filter.createdAt = { $lt: cursor.createdAt };
  }

  const page = await PharmacyMessage.find(filter).sort({ createdAt: -1 }).limit(limit);
  const messages = page.reverse().map(redactMessage);
  const hasMore = page.length === limit;

  res.status(200).json({ success: true, data: { messages, hasMore } });
});

/**
 * @desc    Send a message - either multipart/form-data (text and/or up to 5
 *          images, exactly like the existing customer-chat feature) or a
 *          plain JSON { productRequest } payload referencing one of the
 *          sender's own inventory items. Never writes to Inventory.quantity -
 *          this is communication only, not a stock transaction.
 * @route   POST /api/pharmacy-network/conversations/:id/messages
 * @access  Private (Admin, pharmacy-scoped participant only)
 */
const sendMessage = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const conversation = await loadConversationForParticipant(req.params.id, myPharmacyId);

  const connection = await PharmacyConnection.findById(conversation.connectionId);
  if (!connection || connection.status === 'blocked') {
    throw new ApiError(403, 'You cannot message this pharmacy right now');
  }

  const otherId = otherPharmacyId(conversation, myPharmacyId);
  const [me, other] = await Promise.all([Pharmacy.findById(myPharmacyId), Pharmacy.findById(otherId)]);
  if (!me || me.status !== 'active') {
    throw new ApiError(403, 'Your pharmacy is currently inactive and cannot send messages');
  }
  if (!other || other.status !== 'active') {
    throw new ApiError(403, 'This pharmacy is currently inactive and cannot receive messages');
  }

  let message;

  if (req.body.productRequest) {
    const { inventoryId, quantityRequested, note } = req.body.productRequest;
    if (!inventoryId || quantityRequested === undefined) {
      throw new ApiError(400, 'A product request needs an inventoryId and quantityRequested');
    }

    const item = await Inventory.findOne({ _id: inventoryId, pharmacyId: myPharmacyId }).populate(
      'medicineId',
      'name'
    );
    if (!item) {
      throw new ApiError(404, 'Inventory item not found in your own stock');
    }

    const qty = parseInt(quantityRequested, 10);
    if (!Number.isFinite(qty) || qty < 1) {
      throw new ApiError(400, 'quantityRequested must be at least 1');
    }

    message = await PharmacyMessage.create({
      conversationId: conversation._id,
      senderPharmacyId: myPharmacyId,
      senderUserId: req.user._id,
      messageType: 'PRODUCT_REQUEST',
      productRequest: {
        inventoryId: item._id,
        medicineName: item.medicineId?.name || 'Medicine',
        quantityRequested: qty,
        note: (note || '').trim(),
      },
    });
  } else {
    const text = (req.body.text || '').trim();
    const files = req.files || [];

    if (!text && files.length === 0) {
      throw new ApiError(400, 'A message must contain text or at least one image');
    }

    const attachments = files.map((file) => ({
      url: `/api/pharmacy-network/conversations/${conversation._id}/attachments/${file.filename}`,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    }));

    const messageType = attachments.length > 0 ? (text ? 'IMAGE_WITH_TEXT' : 'IMAGE') : 'TEXT';

    message = await PharmacyMessage.create({
      conversationId: conversation._id,
      senderPharmacyId: myPharmacyId,
      senderUserId: req.user._id,
      messageType,
      text,
      attachments,
    });
  }

  conversation.lastMessageText = previewFor(message);
  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessageSenderPharmacyId = myPharmacyId;
  // The recipient's unread count goes up; the sender has obviously seen the
  // thread up to this point, so their own count resets.
  const myField = conversation.unreadFieldFor(myPharmacyId);
  const otherField = myField === 'unreadCountLow' ? 'unreadCountHigh' : 'unreadCountLow';
  conversation[otherField] += 1;
  conversation[myField] = 0;
  await conversation.save();

  res.status(201).json({ success: true, data: { message } });
});

/**
 * @desc    Marks a conversation as read for the caller - zeroes their unread
 *          count and stamps readAt on the other pharmacy's unread messages.
 * @route   PATCH /api/pharmacy-network/conversations/:id/read
 * @access  Private (Admin, pharmacy-scoped participant only)
 */
const markConversationRead = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const conversation = await loadConversationForParticipant(req.params.id, myPharmacyId);
  const otherId = otherPharmacyId(conversation, myPharmacyId);

  const myField = conversation.unreadFieldFor(myPharmacyId);
  conversation[myField] = 0;
  await conversation.save();

  await PharmacyMessage.updateMany(
    { conversationId: conversation._id, senderPharmacyId: otherId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  res.status(200).json({ success: true, data: { conversation } });
});

/**
 * @desc    Soft-delete a message. Any admin of the SENDING pharmacy may
 *          delete it (read state/unread counters are tracked per pharmacy,
 *          not per individual admin account, matching the rest of this
 *          feature) - never the recipient.
 * @route   DELETE /api/pharmacy-network/conversations/:id/messages/:messageId
 * @access  Private (Admin, pharmacy-scoped, sender pharmacy only)
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const conversation = await loadConversationForParticipant(req.params.id, myPharmacyId);

  const message = await PharmacyMessage.findOne({ _id: req.params.messageId, conversationId: conversation._id });
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }
  if (String(message.senderPharmacyId) !== String(myPharmacyId)) {
    throw new ApiError(403, "You can only delete your own pharmacy's messages");
  }

  if (!message.deletedAt) {
    message.deletedAt = new Date();
    await message.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, data: { message: redactMessage(message) } });
});

/**
 * @desc    Streams a chat attachment. Authenticated via a query-string token
 *          rather than the Authorization header, since a plain <img src> URL
 *          can't attach custom headers - still requires a valid JWT and a
 *          real participant match, so this is genuine per-conversation
 *          authorization, not just an unguessable filename.
 * @route   GET /api/pharmacy-network/conversations/:id/attachments/:filename
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

  let myPharmacyId;
  try {
    myPharmacyId = getOwnPharmacyId(user);
  } catch {
    throw new ApiError(403, 'You are not authorized to view this attachment');
  }

  const conversation = await PharmacyConversation.findById(req.params.id);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  if (!isParticipant(conversation, myPharmacyId)) {
    throw new ApiError(403, 'You are not authorized to view this attachment');
  }

  // path.basename strips any directory-traversal attempt before it ever
  // reaches the filesystem; the DB check below confirms this exact file is
  // actually one of this conversation's own attachments.
  const safeName = path.basename(req.params.filename);
  const belongsToConversation = await PharmacyMessage.exists({
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
  getMyPharmacyConversations,
  getUnreadSummary,
  getMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
  getAttachment,
};
