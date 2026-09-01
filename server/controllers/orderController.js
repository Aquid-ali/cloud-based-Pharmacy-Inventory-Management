const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const Store = require('../models/Store');
const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');
const ApiError = require('../utils/ApiError');

const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_FEE = 40;

/**
 * @desc    Place a new order against a legacy Store's Medicine stock. Prices and
 *          stock are always re-derived from the live Medicine documents
 *          server-side (client-sent prices are ignored) so a tampered request
 *          can't under-pay or over-order.
 */
const createStoreOrder = async (req, res) => {
  const { items, deliveryType, address, storeId, paymentMethod } = req.body;

  const store = await Store.findById(storeId);
  if (!store) {
    throw new ApiError(404, 'Selected store was not found');
  }

  const medicineIds = items.map((item) => item.medicineId);
  const medicines = await Medicine.find({ _id: { $in: medicineIds } });
  const medicineById = new Map(medicines.map((m) => [m._id.toString(), m]));

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const medicine = medicineById.get(item.medicineId);
    if (!medicine) {
      throw new ApiError(404, `Medicine ${item.medicineId} was not found`);
    }
    if (!medicine.store.equals(storeId)) {
      throw new ApiError(400, `${medicine.medicineName} is not available from the selected store`);
    }
    if (medicine.quantity < item.quantity) {
      throw new ApiError(400, `Only ${medicine.quantity} unit(s) of ${medicine.medicineName} are available`);
    }

    const lineTotal = medicine.sellingPrice * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      medicine: medicine._id,
      medicineName: medicine.medicineName,
      sellingPrice: medicine.sellingPrice,
      quantity: item.quantity,
      lineTotal,
    });
  }

  const deliveryFee = deliveryType === 'Delivery' && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  const totalAmount = subtotal + deliveryFee;

  // Decrement stock for each medicine (triggers the pre-save status hook)
  for (const item of orderItems) {
    const medicine = medicineById.get(item.medicine.toString());
    medicine.quantity -= item.quantity;
    await medicine.save();
  }

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    deliveryType,
    address: deliveryType === 'Delivery' ? address : undefined,
    store: storeId,
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
    pricing: { subtotal, deliveryFee, totalAmount },
  });

  const populatedOrder = await order.populate('store');

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: { order: populatedOrder },
  });
};

/**
 * @desc    Place a new order against a Pharmacy's live Inventory. Each item's
 *          medicineId is a MedicineCatalog id (not a specific batch) - the
 *          cheapest non-expired batch at the pharmacy with enough stock is
 *          selected server-side, since customers order "a medicine from a
 *          pharmacy", not an internal batch. Prices/stock are always re-derived
 *          from the live Inventory documents (client-sent prices are ignored).
 */
const createPharmacyOrder = async (req, res) => {
  const { items, deliveryType, address, pharmacyId, paymentMethod } = req.body;

  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId, status: 'active' });
  if (!pharmacy) {
    throw new ApiError(404, 'Selected pharmacy was not found');
  }

  const orderItems = [];
  const batchesToDecrement = [];
  let subtotal = 0;

  for (const item of items) {
    const candidateBatches = await Inventory.find({
      pharmacyId,
      medicineId: item.medicineId,
      status: { $ne: 'Expired' },
    })
      .sort({ sellingPrice: 1 })
      .populate('medicineId', 'name');

    if (candidateBatches.length === 0) {
      throw new ApiError(404, `Medicine ${item.medicineId} is not available from the selected pharmacy`);
    }

    const batch = candidateBatches.find((b) => b.quantity >= item.quantity);
    if (!batch) {
      const totalAvailable = candidateBatches.reduce((sum, b) => sum + b.quantity, 0);
      throw new ApiError(
        400,
        `Only ${totalAvailable} unit(s) of ${candidateBatches[0].medicineId.name} are available at this pharmacy`
      );
    }

    const lineTotal = batch.sellingPrice * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      inventoryItem: batch._id,
      medicineName: batch.medicineId.name,
      sellingPrice: batch.sellingPrice,
      quantity: item.quantity,
      lineTotal,
    });
    batchesToDecrement.push({ batch, quantity: item.quantity });
  }

  const deliveryFee = deliveryType === 'Delivery' && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  const totalAmount = subtotal + deliveryFee;

  // Decrement stock for each batch (triggers the pre-save status hook)
  for (const { batch, quantity } of batchesToDecrement) {
    batch.quantity -= quantity;
    await batch.save();
  }

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    deliveryType,
    address: deliveryType === 'Delivery' ? address : undefined,
    pharmacy: pharmacyId,
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
    pricing: { subtotal, deliveryFee, totalAmount },
  });

  const populatedOrder = await order.populate('pharmacy');

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: { order: populatedOrder },
  });
};

/**
 * @desc    Place a new order - dispatches to the Store or Pharmacy path
 *          depending on which id the client sent.
 * @route   POST /api/orders
 * @access  Private (Customer)
 */
const createOrder = asyncHandler(async (req, res) => {
  if (req.body.pharmacyId) {
    return createPharmacyOrder(req, res);
  }
  return createStoreOrder(req, res);
});

/**
 * @desc    List the authenticated customer's own orders, newest first
 * @route   GET /api/orders/mine
 * @access  Private (Customer)
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('store')
    .populate('pharmacy')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { orders } });
});

/**
 * @desc    List all orders placed with the signed-in Admin's store or pharmacy,
 *          newest first. An Admin account is scoped to exactly one of the two
 *          models (see User.js) - whichever one is set determines the filter.
 * @route   GET /api/orders
 * @access  Private (Admin)
 */
const getStoreOrders = asyncHandler(async (req, res) => {
  const filter = req.user.store
    ? { store: req.user.store._id }
    : req.user.pharmacyId
    ? { pharmacy: req.user.pharmacyId._id || req.user.pharmacyId }
    : null;

  // An Admin scoped to neither model has no orders to show - not an error.
  if (!filter) {
    return res.status(200).json({ success: true, data: { orders: [] } });
  }

  const orders = await Order.find(filter)
    .populate('user', 'fullName email phone')
    .populate('store')
    .populate('pharmacy')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { orders } });
});

/**
 * @desc    Get a single order. Customers may only view their own orders;
 *          Admins may only view orders belonging to their own store/pharmacy.
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('store')
    .populate('pharmacy')
    .populate('user', 'fullName email phone');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isStoreAdmin = req.user.role === 'Admin' && !!req.user.store && !!order.store && order.store._id.equals(req.user.store._id);
  const isPharmacyAdmin =
    req.user.role === 'Admin' &&
    !!req.user.pharmacyId &&
    !!order.pharmacy &&
    order.pharmacy._id.equals(req.user.pharmacyId._id || req.user.pharmacyId);

  if (!isOwner && !isStoreAdmin && !isPharmacyAdmin) {
    throw new ApiError(403, 'You are not authorized to view this order');
  }

  res.status(200).json({ success: true, data: { order } });
});

/**
 * @desc    Update an order's fulfillment status
 * @route   PATCH /api/orders/:id/status
 * @access  Private (Admin, own store/pharmacy only)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const isStoreAdmin = !!req.user.store && !!order.store && order.store.equals(req.user.store._id);
  const isPharmacyAdmin =
    !!req.user.pharmacyId &&
    !!order.pharmacy &&
    order.pharmacy.equals(req.user.pharmacyId._id || req.user.pharmacyId);

  if (!isStoreAdmin && !isPharmacyAdmin) {
    throw new ApiError(403, 'You can only manage orders belonging to your own store');
  }

  order.status = req.body.status;
  await order.save();

  const populatedOrder = await order.populate([
    { path: 'store' },
    { path: 'pharmacy' },
    { path: 'user', select: 'fullName email phone' },
  ]);

  res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: { order: populatedOrder },
  });
});

module.exports = { createOrder, getMyOrders, getStoreOrders, getOrderById, updateOrderStatus };
