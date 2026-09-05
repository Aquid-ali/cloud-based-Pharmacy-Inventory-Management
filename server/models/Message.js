const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const MAX_ATTACHMENTS = 5;

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['Customer', 'Admin'], required: true },
    messageType: { type: String, enum: ['TEXT', 'IMAGE', 'IMAGE_WITH_TEXT'], required: true },
    text: { type: String, trim: true, maxlength: 2000, default: '' },
    attachments: {
      type: [attachmentSchema],
      validate: [(arr) => arr.length <= MAX_ATTACHMENTS, `A message can have at most ${MAX_ATTACHMENTS} attachments`],
      default: [],
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A message must carry something - never persist a fully empty one.
messageSchema.pre('validate', function (next) {
  if (!this.text?.trim() && this.attachments.length === 0) {
    return next(new Error('A message must contain text or at least one attachment'));
  }
  next();
});

// Fetches a conversation's messages newest-first for cursor pagination.
messageSchema.index({ conversationId: 1, createdAt: -1 });

messageSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Message', messageSchema);
module.exports.MAX_ATTACHMENTS = MAX_ATTACHMENTS;
