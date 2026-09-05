const mongoose = require('mongoose');

// A private chat between one Customer and one Pharmacy. Scoped to the newer
// Pharmacy model only (not the legacy Store model), matching the same scope
// boundary already established for /shop/* and the rest of the customer-
// facing storefront.
const conversationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },
    // Denormalized preview fields so the conversation list can render without
    // a second query per row.
    lastMessageText: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageSenderRole: { type: String, enum: ['Customer', 'Admin'] },
    customerUnreadCount: { type: Number, default: 0, min: 0 },
    pharmacyUnreadCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// One conversation per customer+pharmacy pair - this is what "find or create"
// actually relies on to prevent duplicates.
conversationSchema.index({ customerId: 1, pharmacyId: 1 }, { unique: true });
conversationSchema.index({ pharmacyId: 1, lastMessageAt: -1 });
conversationSchema.index({ customerId: 1, lastMessageAt: -1 });

conversationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Conversation', conversationSchema);
