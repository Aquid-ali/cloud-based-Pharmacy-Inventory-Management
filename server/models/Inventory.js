const mongoose = require('mongoose');

// Fallback low-stock threshold used only when a record has no minimumStock set
const LOW_STOCK_THRESHOLD = 20;

const inventorySchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: [true, 'Pharmacy is required'],
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineCatalog',
      required: [true, 'Medicine is required'],
      index: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    // Optional free-text supplier name, carried over from the legacy Medicine
    // model's equivalent field where available (e.g. via migration).
    supplier: {
      type: String,
      trim: true,
    },
    // Per-batch reorder threshold, used to derive the Low Stock status below
    minimumStock: {
      type: Number,
      required: [true, 'Minimum stock is required'],
      min: [0, 'Minimum stock cannot be negative'],
      default: 10,
    },
    // Derived/operational status, kept in sync via pre-save hook
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Expired'],
      default: 'In Stock',
    },
  },
  { timestamps: true }
);

// A pharmacy can stock the same medicine in many batches, but not record the
// same batch twice. Different pharmacies may each hold their own batch of the
// same medicineId without conflict, since pharmacyId is part of the key.
inventorySchema.index({ pharmacyId: 1, medicineId: 1, batchNumber: 1 }, { unique: true });

// Shared by the pre-save hook and any future bulk-insert path (insertMany
// never triggers 'save' middleware), mirroring Medicine.computeStatus.
inventorySchema.statics.computeStatus = function ({ quantity, expiryDate, minimumStock }) {
  const now = new Date();
  const threshold = Number.isFinite(minimumStock) ? minimumStock : LOW_STOCK_THRESHOLD;
  if (expiryDate && new Date(expiryDate) < now) return 'Expired';
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= threshold) return 'Low Stock';
  return 'In Stock';
};

inventorySchema.pre('save', function (next) {
  this.status = this.constructor.computeStatus(this);
  next();
});

inventorySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Inventory', inventorySchema);
