const mongoose = require('mongoose');
const crypto = require('crypto');

// Human-readable unique id, e.g. PHM-LX3F9A2B1C - independent of the Mongo _id
const generatePharmacyId = () =>
  `PHM-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const pharmacySchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: String,
      unique: true,
      default: generatePharmacyId,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    // Optional - powers the customer-facing "nearby pharmacies" sort. Not
    // required since there's no admin UI to capture it yet (only the seed
    // script sets it); pharmacies without it just don't participate in
    // distance-based sorting.
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

pharmacySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Pharmacy', pharmacySchema);
