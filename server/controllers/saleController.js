const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const ApiError = require('../utils/ApiError');

const GST_RATE = 0.18;

const ownScopeFilter = (req) => {
  if (req.user.pharmacyId) return { pharmacy: req.user.pharmacyId._id || req.user.pharmacyId };
  if (req.user.store) return { store: req.user.store._id };
  return null;
};

/**
 * @desc    Record a counter sale against the legacy Store's Medicine stock.
 *          Every item is validated (ownership + sufficient quantity) before
 *          any stock is decremented, so a bad item never leaves a partial sale.
 */
const createStoreSale = async (req, res) => {
  const { items, paymentMethod, customerName } = req.body;
  const storeId = req.user.store._id;

  const medicineIds = items.map((item) => item.medicineId);
  const medicines = await Medicine.find({ _id: { $in: medicineIds } });
  const medicineById = new Map(medicines.map((m) => [m._id.toString(), m]));

  const saleItems = [];
  let subtotal = 0;
  let totalCost = 0;

  for (const item of items) {
    const medicine = medicineById.get(item.medicineId);
    if (!medicine) {
      throw new ApiError(404, `Medicine ${item.medicineId} was not found`);
    }
    if (!medicine.store.equals(storeId)) {
      throw new ApiError(403, `${medicine.medicineName} does not belong to your store`);
    }
    if (medicine.quantity < item.quantity) {
      throw new ApiError(400, `Only ${medicine.quantity} unit(s) of ${medicine.medicineName} are in stock`);
    }

    const lineTotal = medicine.sellingPrice * item.quantity;
    const lineCost = medicine.buyingPrice * item.quantity;
    subtotal += lineTotal;
    totalCost += lineCost;

    saleItems.push({
      medicine: medicine._id,
      medicineName: medicine.medicineName,
      batchNumber: medicine.batchNumber,
      quantity: item.quantity,
      unitPrice: medicine.sellingPrice,
      unitCost: medicine.buyingPrice,
      lineTotal,
      lineCost,
    });
  }

  // Decrement stock only after every item has passed validation (triggers the pre-save status hook)
  for (const item of saleItems) {
    const medicine = medicineById.get(item.medicine.toString());
    medicine.quantity -= item.quantity;
    await medicine.save();
  }

  const tax = Math.round(subtotal * GST_RATE);
  const sale = await Sale.create({
    items: saleItems,
    store: storeId,
    soldBy: req.user._id,
    paymentMethod,
    customerName: customerName || undefined,
    subtotal,
    tax,
    totalAmount: subtotal + tax,
    totalCost,
    profit: subtotal - totalCost,
  });

  res.status(201).json({ success: true, message: 'Sale recorded successfully', data: { sale } });
};

/**
 * @desc    Record a counter sale against a Pharmacy's live Inventory. Each
 *          item's medicineId is a MedicineCatalog id (not a specific batch) -
 *          the cheapest non-expired batch with enough stock is selected
 *          server-side, mirroring orderController's createPharmacyOrder.
 */
const createPharmacySale = async (req, res) => {
  const { items, paymentMethod, customerName } = req.body;
  const pharmacyId = req.user.pharmacyId._id || req.user.pharmacyId;

  const saleItems = [];
  const batchesToDecrement = [];
  let subtotal = 0;
  let totalCost = 0;

  for (const item of items) {
    const candidateBatches = await Inventory.find({
      pharmacyId,
      medicineId: item.medicineId,
      status: { $ne: 'Expired' },
    })
      .sort({ sellingPrice: 1 })
      .populate('medicineId', 'name');

    if (candidateBatches.length === 0) {
      throw new ApiError(404, `Medicine ${item.medicineId} is not in your pharmacy's inventory`);
    }

    const batch = candidateBatches.find((b) => b.quantity >= item.quantity);
    if (!batch) {
      const totalAvailable = candidateBatches.reduce((sum, b) => sum + b.quantity, 0);
      throw new ApiError(
        400,
        `Only ${totalAvailable} unit(s) of ${candidateBatches[0].medicineId.name} are in stock`
      );
    }

    const lineTotal = batch.sellingPrice * item.quantity;
    const lineCost = batch.purchasePrice * item.quantity;
    subtotal += lineTotal;
    totalCost += lineCost;

    saleItems.push({
      inventoryItem: batch._id,
      medicineName: batch.medicineId.name,
      batchNumber: batch.batchNumber,
      quantity: item.quantity,
      unitPrice: batch.sellingPrice,
      unitCost: batch.purchasePrice,
      lineTotal,
      lineCost,
    });
    batchesToDecrement.push({ batch, quantity: item.quantity });
  }

  for (const { batch, quantity } of batchesToDecrement) {
    batch.quantity -= quantity;
    await batch.save();
  }

  const tax = Math.round(subtotal * GST_RATE);
  const sale = await Sale.create({
    items: saleItems,
    pharmacy: pharmacyId,
    soldBy: req.user._id,
    paymentMethod,
    customerName: customerName || undefined,
    subtotal,
    tax,
    totalAmount: subtotal + tax,
    totalCost,
    profit: subtotal - totalCost,
  });

  res.status(201).json({ success: true, message: 'Sale recorded successfully', data: { sale } });
};

/**
 * @desc    Record a counter sale (POS "Complete Sale") - dispatches to the
 *          Store or Pharmacy path depending on which one the authenticated
 *          Admin belongs to. This is the only place stock is decremented for
 *          an in-person sale (as opposed to a customer's online order).
 * @route   POST /api/sales
 * @access  Private (Admin)
 */
const createSale = asyncHandler(async (req, res) => {
  if (req.user.pharmacyId) {
    return createPharmacySale(req, res);
  }
  if (req.user.store) {
    return createStoreSale(req, res);
  }
  throw new ApiError(403, 'Your account is not associated with a store or pharmacy');
});

/**
 * @desc    List sales recorded at the authenticated Admin's own store/pharmacy, newest first
 * @route   GET /api/sales
 * @access  Private (Admin)
 */
const getSales = asyncHandler(async (req, res) => {
  const filter = ownScopeFilter(req);
  if (!filter) {
    return res.status(200).json({
      success: true,
      data: { sales: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } },
    });
  }

  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [sales, total] = await Promise.all([
    Sale.find(filter).populate('soldBy', 'fullName').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Sale.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      sales,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
    },
  });
});

/**
 * @desc    Aggregated sales/profit stats for the authenticated Admin's own
 *          store/pharmacy - powers the Sales History stat tiles, Sales
 *          Report, and Profit Analysis pages. Zeroed (not an error) for an
 *          Admin with neither a store nor a pharmacy.
 * @route   GET /api/sales/stats/summary
 * @access  Private (Admin)
 */
const getSalesStats = asyncHandler(async (req, res) => {
  const filter = ownScopeFilter(req);

  const zeroStats = {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    growthPercent: null,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
  };

  if (!filter) {
    return res.status(200).json({ success: true, data: zeroStats });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totals, todayAgg, monthAgg, lastMonthAgg] = await Promise.all([
    Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          totalCost: { $sum: '$totalCost' },
          totalProfit: { $sum: '$profit' },
        },
      },
    ]),
    Sale.aggregate([
      { $match: { ...filter, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]),
    Sale.aggregate([
      { $match: { ...filter, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]),
    Sale.aggregate([
      { $match: { ...filter, createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const { totalRevenue = 0, totalOrders = 0, totalCost = 0, totalProfit = 0 } = totals[0] || {};
  const todayRevenue = todayAgg[0]?.revenue || 0;
  const monthRevenue = monthAgg[0]?.revenue || 0;
  const lastMonthRevenue = lastMonthAgg[0]?.revenue || 0;

  res.status(200).json({
    success: true,
    data: {
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      todayRevenue,
      monthRevenue,
      growthPercent: lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null,
      totalCost,
      totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    },
  });
});

module.exports = { createSale, getSales, getSalesStats };
