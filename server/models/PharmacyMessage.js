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

// Snapshotted at send time - never a live join, so history stays intact even
// if the Inventory item is later edited/removed. Pure communication: nothing
// here ever touches Inventory.quantity, this is not a stock transaction.
const productRequestSchema = new mongoose.Schema(
  {
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    medicineName: { type: String, required: true, trim: true },
    quantityRequested: { type: Number, required: true, min: 1 },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false }
);

const MAX_ATTACHMENTS = 5;

const pharmacyMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PharmacyConversation',
      required: true,
      index: true,
    },
    senderPharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    // Which admin actually typed it - audit trail only, read state/unread
    // counters stay tracked at the pharmacy level (a pharmacy may have
    // multiple Admin accounts sharing one inbox).
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messageType: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'IMAGE_WITH_TEXT', 'PRODUCT_REQUEST'],
      required: true,
    },
    text: { type: String, trim: true, maxlength: 2000, default: '' },
    attachments: {
      type: [attachmentSchema],
      validate: [(arr) => arr.length <= MAX_ATTACHMENTS, `A message can have at most ${MAX_ATTACHMENTS} attachments`],
      default: [],
    },
    productRequest: { type: productRequestSchema, default: null },
    readAt: { type: Date, default: null },
    // Soft delete - content stays in the DB, but getMessages redacts
    // text/attachments/productRequest to '' / [] / null whenever deletedAt is
    // set, so deleted content never actually reaches either party again.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

pharmacyMessageSchema.pre('validate', function (next) {
  const hasText = Boolean(this.text?.trim());
  const hasAttachments = this.attachments.length > 0;
  const hasProductRequest = Boolean(this.productRequest);

  if (!hasText && !hasAttachments && !hasProductRequest) {
    return next(new Error('A message must contain text, at least one attachment, or a product request'));
  }
  if (hasProductRequest && (hasText || hasAttachments)) {
    return next(new Error('A product request must be sent as its own message'));
  }
  next();
});

// Fetches a conversation's messages newest-first for cursor pagination.
pharmacyMessageSchema.index({ conversationId: 1, createdAt: -1 });

pharmacyMessageSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('PharmacyMessage', pharmacyMessageSchema);
module.exports.MAX_ATTACHMENTS = MAX_ATTACHMENTS;
