const mongoose = require('mongoose');

// A private 1:1 chat thread between two pharmacies, created automatically the
// moment their PharmacyConnection is accepted. Independent of the existing
// Customer<->Pharmacy Conversation model, which is hardcoded to exactly one
// Customer + one Pharmacy party and can't represent two Pharmacy parties.
const pharmacyConversationSchema = new mongoose.Schema(
  {
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PharmacyConnection',
      required: true,
      unique: true,
    },
    // Denormalized copy of the connection's sorted pair, so every
    // message/read/attachment check is one query, never a join back to
    // PharmacyConnection.
    pharmacyLow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },
    pharmacyHigh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },
    lastMessageText: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageSenderPharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      default: null,
    },
    unreadCountLow: { type: Number, default: 0, min: 0 },
    unreadCountHigh: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// One conversation per pharmacy pair, ever.
pharmacyConversationSchema.index({ pharmacyLow: 1, pharmacyHigh: 1 }, { unique: true });
pharmacyConversationSchema.index({ pharmacyLow: 1, lastMessageAt: -1 });
pharmacyConversationSchema.index({ pharmacyHigh: 1, lastMessageAt: -1 });

pharmacyConversationSchema.methods.otherPharmacy = function (myPharmacyId) {
  return String(this.pharmacyLow) === String(myPharmacyId) ? this.pharmacyHigh : this.pharmacyLow;
};

pharmacyConversationSchema.methods.unreadFieldFor = function (myPharmacyId) {
  return String(this.pharmacyLow) === String(myPharmacyId) ? 'unreadCountLow' : 'unreadCountHigh';
};

pharmacyConversationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('PharmacyConversation', pharmacyConversationSchema);
