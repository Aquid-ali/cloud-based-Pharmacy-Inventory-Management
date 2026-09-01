const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    // Exactly one of these is set, matching which path created the order:
    // `medicine` for legacy Store+Medicine orders, `inventoryItem` for the
    // newer Pharmacy+Inventory+MedicineCatalog orders.
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
    sellingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(items) => items.length > 0, 'Order must contain at least one item'],
    },
    deliveryType: {
      type: String,
      enum: ['Delivery', 'Pickup'],
      required: true,
    },
    address: {
      type: addressSchema,
      required: function () {
        return this.deliveryType === 'Delivery';
      },
    },
    // Exactly one of `store` (legacy) or `pharmacy` (newer) is set, mirroring
    // orderItemSchema's medicine/inventoryItem split above.
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
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI', 'Card'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      deliveryFee: { type: Number, required: true, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
    },
    status: {
      type: String,
      enum: ['Placed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
  },
  { timestamps: true }
);

orderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Order', orderSchema);
