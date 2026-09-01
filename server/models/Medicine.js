const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    manufacturingDate: {
      type: Date,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    buyingPrice: {
      type: Number,
      required: [true, 'Buying price is required'],
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    // Per-medicine low-stock threshold; falls back to LOW_STOCK_THRESHOLD when unset
    reorderLevel: {
      type: Number,
      min: [0, 'Reorder level cannot be negative'],
    },
    supplier: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Derived/operational status, kept in sync via pre-save hook
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Expired'],
      default: 'In Stock',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Low stock threshold - kept simple for milestone 1, can be made configurable later
const LOW_STOCK_THRESHOLD = 20;

// Shared by the pre-save hook (single create/update) and the bulk CSV import path,
// which uses insertMany and therefore never triggers 'save' middleware.
medicineSchema.statics.computeStatus = function ({ quantity, expiryDate, reorderLevel }) {
  const now = new Date();
  const threshold = Number.isFinite(reorderLevel) ? reorderLevel : LOW_STOCK_THRESHOLD;
  if (expiryDate && new Date(expiryDate) < now) return 'Expired';
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= threshold) return 'Low Stock';
  return 'In Stock';
};

medicineSchema.pre('save', function (next) {
  this.status = this.constructor.computeStatus(this);
  next();
});

medicineSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Text index to support fast search on name/generic name/manufacturer
medicineSchema.index({ medicineName: 'text', genericName: 'text', manufacturer: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
