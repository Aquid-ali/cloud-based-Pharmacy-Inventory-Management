const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    // Exactly one of these is set, matching which path recorded the sale:
    // `medicine` for legacy Store+Medicine sales, `inventoryItem` for the
    // newer Pharmacy+Inventory+MedicineCatalog sales.
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: function () {
        return !this.inventoryItem;
      },
    },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: function () {
        return !this.medicine;
      },
    },
    medicineName: { type: String, required: true },
    batchNumber: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    lineCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    items: {
      type: [saleItemSchema],
      required: true,
      validate: [(items) => items.length > 0, 'Sale must contain at least one item'],
    },
    // Exactly one of `store` (legacy) or `pharmacy` (newer) is set, mirroring
    // Order's store/pharmacy split.
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: function () {
        return !this.pharmacy;
      },
      index: true,
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: function () {
        return !this.store;
      },
      index: true,
    },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, trim: true, default: 'Walk-in Customer' },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card'],
      required: true,
    },
    // subtotal = sum of item selling prices; tax is GST collected on top of that
    // (a pass-through, not profit); profit is derived from subtotal vs cost.
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
  },
  { timestamps: true }
);

saleSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Sale', saleSchema);
