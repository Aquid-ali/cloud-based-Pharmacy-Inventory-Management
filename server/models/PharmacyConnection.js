const mongoose = require('mongoose');

// A request/connection between an UNORDERED pair of pharmacies. Uniqueness is
// solved by always storing the pair sorted (pharmacyLow/pharmacyHigh by
// ObjectId hex string) so (A,B) and (B,A) always collapse to the same doc,
// regardless of who initiates - this is what the unique index below actually
// relies on to reject duplicate/simultaneous requests from either side.
const pharmacyConnectionSchema = new mongoose.Schema(
  {
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
    // Always equal to pharmacyLow or pharmacyHigh. Drives "Request Pending"
    // vs "Accept/Decline" UI copy and who may accept/decline/cancel.
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
      index: true,
    },
    // Only meaningful while status === 'blocked'. Always pharmacyLow or
    // pharmacyHigh. Only this pharmacy may unblock.
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      default: null,
    },
    respondedAt: { type: Date, default: null },
    blockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// The whole feature's duplicate-prevention rests on this one index - one
// connection document per pair of pharmacies, ever.
pharmacyConnectionSchema.index({ pharmacyLow: 1, pharmacyHigh: 1 }, { unique: true });
pharmacyConnectionSchema.index({ pharmacyHigh: 1, status: 1 });
pharmacyConnectionSchema.index({ pharmacyLow: 1, status: 1 });

pharmacyConnectionSchema.statics.sortPair = function (idA, idB) {
  const [pharmacyLow, pharmacyHigh] = [String(idA), String(idB)].sort();
  return { pharmacyLow, pharmacyHigh };
};

pharmacyConnectionSchema.methods.otherPharmacy = function (myPharmacyId) {
  return String(this.pharmacyLow) === String(myPharmacyId) ? this.pharmacyHigh : this.pharmacyLow;
};

pharmacyConnectionSchema.methods.involves = function (pharmacyId) {
  const mine = String(pharmacyId);
  return String(this.pharmacyLow) === mine || String(this.pharmacyHigh) === mine;
};

pharmacyConnectionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('PharmacyConnection', pharmacyConnectionSchema);
