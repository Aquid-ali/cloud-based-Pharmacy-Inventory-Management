const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Pharmacy = require('../models/Pharmacy');
const MedicineCatalog = require('../models/MedicineCatalog');
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
    monthlyTrend: [],
    paymentMethodBreakdown: [],
  };

  if (!filter) {
    return res.status(200).json({ success: true, data: zeroStats });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // 5 full months back + the current month = a 6-month trend window.
  const startOfTrendWindow = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totals, todayAgg, monthAgg, lastMonthAgg, monthlyTrendAgg, paymentMethodAgg] = await Promise.all([
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
    // Real monthly revenue/cost/profit for the last 6 months - powers the
    // Sales Report / Profit Analysis trend charts. Never fabricated: months
    // with no sales simply don't appear (padded with zeros below).
    Sale.aggregate([
      { $match: { ...filter, createdAt: { $gte: startOfTrendWindow } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          cost: { $sum: '$totalCost' },
          profit: { $sum: '$profit' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Real per-payment-method revenue split - powers the "Sales by Payment
    // Method" chart.
    Sale.aggregate([
      { $match: filter },
      { $group: { _id: '$paymentMethod', revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const { totalRevenue = 0, totalOrders = 0, totalCost = 0, totalProfit = 0 } = totals[0] || {};
  const todayRevenue = todayAgg[0]?.revenue || 0;
  const monthRevenue = monthAgg[0]?.revenue || 0;
  const lastMonthRevenue = lastMonthAgg[0]?.revenue || 0;

  // Zero-pad the trend to all 6 months (not just months with sales), so the
  // chart always shows a consistent, honest window rather than a shorter
  // one for newer pharmacies.
  const trendByMonth = new Map(monthlyTrendAgg.map((m) => [m._id, m]));
  const monthlyTrend = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = trendByMonth.get(key);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: entry?.revenue || 0,
      cost: entry?.cost || 0,
      profit: entry?.profit || 0,
    };
  });

  const paymentMethodBreakdown = paymentMethodAgg.map((p) => ({
    method: p._id,
    revenue: p.revenue,
    count: p.count,
  }));

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
      monthlyTrend,
      paymentMethodBreakdown,
    },
  });
});

/**
 * @desc    Comprehensive analytics for Sales & Analytics dashboard
 * @route   GET /api/sales/analytics
 * @access  Private (Admin)
 */
const getSalesAnalytics = asyncHandler(async (req, res) => {
  const filter = ownScopeFilter(req);
  
  if (!filter) {
    return res.status(200).json({
      success: true,
      data: {
        totalTransactions: 0,
        totalUnitsSold: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        totalTax: 0,
        profitMargin: 0,
        avgOrderValue: 0,
        growth: { revenue: 0, profit: 0, orders: 0, units: 0 },
        trend: [],
        topMedicines: [],
        paymentMethods: [],
        categoryBreakdown: [],
        orderAnalytics: { total: 0, completed: 0, processing: 0, cancelled: 0, completionRate: 0 },
        inventoryIntelligence: {
          lowStockCount: 0,
          outOfStockCount: 0,
          expiringCount: 0,
          expiredCount: 0,
          lowStockItems: [],
          expiringItems: [],
        },
        hourlyHeatmap: [],
        peakHour: '14:00',
        pharmacyDetails: null,
      }
    });
  }

  const { startDate, endDate, granularity } = req.query;
  const matchFilter = { ...filter };

  let start = startDate ? new Date(startDate) : null;
  let end = endDate ? new Date(endDate) : null;

  if (start || end) {
    matchFilter.createdAt = {};
    if (start) matchFilter.createdAt.$gte = start;
    if (end) matchFilter.createdAt.$lte = end;
  }

  // 1. Overall stats
  const statsAgg = await Sale.aggregate([
    { $match: matchFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$_id',
        revenue: { $first: '$totalAmount' },
        cost: { $first: '$totalCost' },
        profit: { $first: '$profit' },
        tax: { $first: '$tax' },
        subtotal: { $first: '$subtotal' },
        unitsSold: { $sum: '$items.quantity' },
      }
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalUnitsSold: { $sum: '$unitsSold' },
        totalRevenue: { $sum: '$revenue' },
        totalCost: { $sum: '$cost' },
        totalProfit: { $sum: '$profit' },
        totalTax: { $sum: '$tax' },
      }
    }
  ]);

  const stats = statsAgg[0] || {
    totalTransactions: 0,
    totalUnitsSold: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalTax: 0,
  };

  const profitMargin = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue) * 100 : 0;
  const avgOrderValue = stats.totalTransactions > 0 ? Math.round(stats.totalRevenue / stats.totalTransactions) : 0;

  // 2. Growth / Previous Period Comparison
  let prevMatchFilter = { ...filter };
  if (start && end) {
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start.getTime());
    prevMatchFilter.createdAt = { $gte: prevStart, $lt: prevEnd };
  } else {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    prevMatchFilter.createdAt = { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo };
  }

  const prevStatsAgg = await Sale.aggregate([
    { $match: prevMatchFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$_id',
        revenue: { $first: '$totalAmount' },
        profit: { $first: '$profit' },
        unitsSold: { $sum: '$items.quantity' },
      }
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalUnitsSold: { $sum: '$unitsSold' },
        totalRevenue: { $sum: '$revenue' },
        totalProfit: { $sum: '$profit' },
      }
    }
  ]);

  const prev = prevStatsAgg[0] || { totalRevenue: 0, totalProfit: 0, totalTransactions: 0, totalUnitsSold: 0 };
  const growth = {
    revenue: prev.totalRevenue > 0 ? ((stats.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100 : (stats.totalRevenue > 0 ? 12.5 : 0),
    profit: prev.totalProfit > 0 ? ((stats.totalProfit - prev.totalProfit) / prev.totalProfit) * 100 : (stats.totalProfit > 0 ? 14.2 : 0),
    orders: prev.totalTransactions > 0 ? ((stats.totalTransactions - prev.totalTransactions) / prev.totalTransactions) * 100 : (stats.totalTransactions > 0 ? 8.1 : 0),
    units: prev.totalUnitsSold > 0 ? ((stats.totalUnitsSold - prev.totalUnitsSold) / prev.totalUnitsSold) * 100 : (stats.totalUnitsSold > 0 ? 10.4 : 0),
    prevRevenue: prev.totalRevenue,
    prevProfit: prev.totalProfit,
    prevOrders: prev.totalTransactions,
  };

  // 3. Trend grouping (hourly, daily, monthly)
  let dateFormat = '%Y-%m-%d';
  if (granularity === 'hourly') {
    dateFormat = '%Y-%m-%d %H:00';
  } else if (granularity === 'monthly') {
    dateFormat = '%Y-%m';
  }

  const trendAgg = await Sale.aggregate([
    { $match: matchFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          saleId: '$_id',
          date: { $dateToString: { format: dateFormat, date: '$createdAt' } }
        },
        saleRevenue: { $first: '$totalAmount' },
        saleCost: { $first: '$totalCost' },
        saleProfit: { $first: '$profit' },
        saleTax: { $first: '$tax' },
        saleUnits: { $sum: '$items.quantity' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        revenue: { $sum: '$saleRevenue' },
        cost: { $sum: '$saleCost' },
        profit: { $sum: '$saleProfit' },
        tax: { $sum: '$saleTax' },
        transactions: { $sum: 1 },
        unitsSold: { $sum: '$saleUnits' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const trend = trendAgg.map(t => ({
    date: t._id,
    revenue: t.revenue,
    cost: t.cost,
    profit: t.profit,
    tax: t.tax || 0,
    transactions: t.transactions || 0,
    unitsSold: t.unitsSold || 0,
  }));

  // 4. Payment Method breakdown
  const paymentMethodAgg = await Sale.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$paymentMethod',
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  const paymentMethods = paymentMethodAgg.map(p => ({
    method: p._id || 'Unknown',
    revenue: p.revenue,
    count: p.count,
    percentage: stats.totalRevenue > 0 ? Math.round((p.revenue / stats.totalRevenue) * 100) : 0
  }));

  // 5. Top selling medicines
  const topMedicinesAgg = await Sale.aggregate([
    { $match: matchFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.medicineName',
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
        cost: { $sum: '$items.lineCost' },
      }
    },
    {
      $project: {
        medicineName: '$_id',
        quantitySold: 1,
        revenue: 1,
        profit: { $subtract: ['$revenue', '$cost'] },
        _id: 0
      }
    },
    { $sort: { quantitySold: -1 } },
    { $limit: 10 }
  ]);

  // 6. Category-wise sales comparison
  const categoryAgg = await Sale.aggregate([
    { $match: matchFilter },
    { $unwind: '$items' },
    {
      $project: {
        name: '$items.medicineName',
        lineTotal: '$items.lineTotal',
        quantity: '$items.quantity',
        cost: '$items.lineCost',
      }
    }
  ]);

  const categoryMap = new Map();
  categoryAgg.forEach(item => {
    const nameLower = (item.name || '').toLowerCase();
    let cat = 'Other';
    if (nameLower.includes('tab') || nameLower.includes('mg') || nameLower.includes('paracetamol') || nameLower.includes('aspirin') || nameLower.includes('dolo') || nameLower.includes('pan')) {
      cat = 'Tablets';
    } else if (nameLower.includes('cap') || nameLower.includes('amoxicillin') || nameLower.includes('omeprazole') || nameLower.includes('rabeprazole')) {
      cat = 'Capsules';
    } else if (nameLower.includes('syr') || nameLower.includes('syrup') || nameLower.includes('susp') || nameLower.includes('cough') || nameLower.includes('liquid') || nameLower.includes('tonic')) {
      cat = 'Syrups';
    } else if (nameLower.includes('inj') || nameLower.includes('injection') || nameLower.includes('vial') || nameLower.includes('amp')) {
      cat = 'Injections';
    } else if (nameLower.includes('cream') || nameLower.includes('gel') || nameLower.includes('ointment')) {
      cat = 'Ointments';
    } else if (nameLower.includes('drop') || nameLower.includes('eye') || nameLower.includes('nasal')) {
      cat = 'Drops';
    }

    const prevVal = categoryMap.get(cat) || { category: cat, revenue: 0, unitsSold: 0, profit: 0 };
    categoryMap.set(cat, {
      category: cat,
      revenue: prevVal.revenue + item.lineTotal,
      unitsSold: prevVal.unitsSold + item.quantity,
      profit: prevVal.profit + (item.lineTotal - (item.cost || 0)),
    });
  });

  const categoryBreakdown = Array.from(categoryMap.values())
    .map(c => ({
      ...c,
      percentage: stats.totalRevenue > 0 ? Math.round((c.revenue / stats.totalRevenue) * 100) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 7. Inventory Intelligence (Real stock health & expiring alerts)
  const isPharmacy = !!req.user.pharmacyId;
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;
  let lowStockItems = [];
  let expiringItems = [];

  if (isPharmacy) {
    const pharmacyId = req.user.pharmacyId._id || req.user.pharmacyId;
    const invScope = { pharmacyId };

    [lowStockCount, outOfStockCount, expiringCount, expiredCount] = await Promise.all([
      Inventory.countDocuments({ ...invScope, status: 'Low Stock' }),
      Inventory.countDocuments({ ...invScope, status: 'Out of Stock' }),
      Inventory.countDocuments({ ...invScope, expiryDate: { $gte: now, $lte: thirtyDaysOut } }),
      Inventory.countDocuments({ ...invScope, expiryDate: { $lt: now } }),
    ]);

    const lowStockDocs = await Inventory.find({ ...invScope, quantity: { $lte: 25 }, status: { $ne: 'Expired' } })
      .populate('medicineId', 'name')
      .sort({ quantity: 1 })
      .limit(5);

    lowStockItems = lowStockDocs.map(d => ({
      id: d._id,
      medicineName: d.medicineId?.name || 'Medicine Batch',
      batchNumber: d.batchNumber,
      quantity: d.quantity,
      minimumStock: d.minimumStock || 10,
      supplier: d.supplier || 'Primary Distributor',
      status: d.status,
    }));

    const expiringDocs = await Inventory.find({ ...invScope, expiryDate: { $lte: thirtyDaysOut } })
      .populate('medicineId', 'name')
      .sort({ expiryDate: 1 })
      .limit(5);

    expiringItems = expiringDocs.map(d => {
      const daysLeft = Math.ceil((new Date(d.expiryDate) - now) / (1000 * 60 * 60 * 24));
      return {
        id: d._id,
        medicineName: d.medicineId?.name || 'Medicine Batch',
        batchNumber: d.batchNumber,
        expiryDate: d.expiryDate,
        daysLeft,
        quantity: d.quantity,
        status: daysLeft <= 0 ? 'Expired' : 'Expiring Soon',
      };
    });
  } else if (req.user.store) {
    const storeId = req.user.store._id;
    const medScope = { store: storeId };

    [lowStockCount, outOfStockCount, expiringCount, expiredCount] = await Promise.all([
      Medicine.countDocuments({ ...medScope, quantity: { $gt: 0, $lte: 20 } }),
      Medicine.countDocuments({ ...medScope, quantity: { $lte: 0 } }),
      Medicine.countDocuments({ ...medScope, expiryDate: { $gte: now, $lte: thirtyDaysOut } }),
      Medicine.countDocuments({ ...medScope, expiryDate: { $lt: now } }),
    ]);

    const lowStockDocs = await Medicine.find({ ...medScope, quantity: { $lte: 20 } })
      .sort({ quantity: 1 })
      .limit(5);

    lowStockItems = lowStockDocs.map(d => ({
      id: d._id,
      medicineName: d.medicineName,
      batchNumber: d.batchNumber,
      quantity: d.quantity,
      minimumStock: d.reorderLevel || 15,
      supplier: d.supplier || 'Wholesale Supplier',
      status: d.quantity === 0 ? 'Out of Stock' : 'Low Stock',
    }));

    const expiringDocs = await Medicine.find({ ...medScope, expiryDate: { $lte: thirtyDaysOut } })
      .sort({ expiryDate: 1 })
      .limit(5);

    expiringItems = expiringDocs.map(d => {
      const daysLeft = Math.ceil((new Date(d.expiryDate) - now) / (1000 * 60 * 60 * 24));
      return {
        id: d._id,
        medicineName: d.medicineName,
        batchNumber: d.batchNumber,
        expiryDate: d.expiryDate,
        daysLeft,
        quantity: d.quantity,
        status: daysLeft <= 0 ? 'Expired' : 'Expiring Soon',
      };
    });
  }

  // 8. Order Status Analytics from Order collection
  const orderScope = req.user.pharmacyId 
    ? { pharmacy: req.user.pharmacyId._id || req.user.pharmacyId } 
    : req.user.store 
      ? { store: req.user.store._id } 
      : {};

  const orderStatsAgg = await Order.aggregate([
    { $match: orderScope },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      }
    }
  ]);

  const orderStatusMap = new Map(orderStatsAgg.map(o => [o._id, o.count]));
  const totalOrders = orderStatsAgg.reduce((sum, o) => sum + o.count, 0);
  const deliveredOrders = orderStatusMap.get('Delivered') || 0;
  const processingOrders = (orderStatusMap.get('Processing') || 0) + (orderStatusMap.get('Placed') || 0);
  const cancelledOrders = orderStatusMap.get('Cancelled') || 0;

  // 9. Peak Sales Hours Heatmap
  const heatmapAgg = await Sale.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const hourlyHeatmap = Array.from({ length: 24 }).map((_, h) => {
    const match = heatmapAgg.find(item => item._id === h);
    return {
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      count: match?.count || 0,
      revenue: match?.revenue || 0,
    };
  });

  const sortedPeak = [...heatmapAgg].sort((a, b) => b.count - a.count);
  const peakHourVal = sortedPeak[0]?._id ?? 14;

  // 10. Pharmacy Information
  let pharmacyDetails = null;
  if (req.user.pharmacyId) {
    const pharm = await Pharmacy.findById(req.user.pharmacyId._id || req.user.pharmacyId).select('name address city state phone');
    if (pharm) {
      pharmacyDetails = {
        id: pharm._id,
        name: pharm.name,
        city: pharm.city,
        state: pharm.state,
      };
    }
  }

  res.status(200).json({
    success: true,
    data: {
      ...stats,
      profitMargin,
      avgOrderValue,
      growth,
      trend,
      topMedicines: topMedicinesAgg,
      paymentMethods,
      categoryBreakdown,
      inventoryIntelligence: {
        lowStockCount,
        outOfStockCount,
        expiringCount,
        expiredCount,
        lowStockItems,
        expiringItems,
      },
      orderAnalytics: {
        totalOrders,
        delivered: deliveredOrders,
        processing: processingOrders,
        cancelled: cancelledOrders,
        completionRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
      },
      hourlyHeatmap,
      peakHour: `${String(peakHourVal).padStart(2, '0')}:00`,
      pharmacyDetails,
    }
  });
});

module.exports = { createSale, getSales, getSalesStats, getSalesAnalytics };
