const asyncHandler = require('express-async-handler');
const Inventory = require('../models/Inventory');
const MedicineCatalog = require('../models/MedicineCatalog');
const ApiError = require('../utils/ApiError');

// Every inventory route requires role 'Admin' (enforced in inventoryRoutes.js), and every
// Admin working against these routes must be pharmacy-scoped. The pharmacyId always comes
// from the authenticated user (populated onto req.user in authMiddleware) - never from the
// request body or query string - so one pharmacy's admin can never read or write another's
// inventory, even by supplying a different pharmacyId on the wire.
const getOwnPharmacyId = (req) => {
  if (!req.user.pharmacyId) {
    throw new ApiError(403, 'Your account is not associated with a pharmacy');
  }
  return req.user.pharmacyId._id || req.user.pharmacyId;
};

/**
 * @desc    Add a medicine batch to the authenticated admin's pharmacy inventory
 * @route   POST /api/inventory
 * @access  Private (Admin, own pharmacy only)
 */
const createInventoryItem = asyncHandler(async (req, res) => {
  const pharmacyId = getOwnPharmacyId(req);
  const { medicineId } = req.body;

  const medicine = await MedicineCatalog.findById(medicineId);
  if (!medicine) {
    throw new ApiError(404, 'Medicine not found in catalog');
  }

  const item = await Inventory.create({ ...req.body, pharmacyId });

  // A brand-new Inventory document is unambiguously a new batch of this
  // existing medicine (Add Stock only ever targets an existing MedicineCatalog
  // entry - it never creates one). Record it on the medicine itself so every
  // customer-facing listing can tell "new batch just arrived" apart from
  // "quantity merely updated" (updateInventoryItem, and sale/order-driven
  // decrements, never touch these fields).
  medicine.latestBatchId = item._id;
  medicine.latestBatchAddedAt = new Date();
  await medicine.save();

  res.status(201).json({
    success: true,
    message: 'Inventory item created successfully',
    data: { inventory: item },
  });
});

/**
 * @desc    Get inventory items belonging to the authenticated admin's pharmacy, with filter & pagination
 * @route   GET /api/inventory
 * @access  Private (Admin, own pharmacy only)
 *
 * Query params:
 *   medicineId  - filter by catalog medicine
 *   status      - In Stock | Low Stock | Out of Stock | Expired
 *   expiry      - "expired" | "expiringSoon" (next 30 days) | "valid"
 *   page        - default 1
 *   limit       - default 10
 */
const getInventoryItems = asyncHandler(async (req, res) => {
  const pharmacyId = getOwnPharmacyId(req);
  const { medicineId, status, expiry, page = 1, limit = 10 } = req.query;

  // pharmacyId is always the authenticated admin's own - a pharmacyId query param
  // (if any) is intentionally ignored so it can never be used to view another pharmacy.
  const filter = { pharmacyId };
  if (medicineId) filter.medicineId = medicineId;
  if (status) filter.status = status;

  if (expiry) {
    const now = new Date();
    if (expiry === 'expired') {
      filter.expiryDate = { $lt: now };
    } else if (expiry === 'expiringSoon') {
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filter.expiryDate = { $gte: now, $lte: thirtyDaysFromNow };
    } else if (expiry === 'valid') {
      filter.expiryDate = { $gt: now };
    }
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('pharmacyId', 'name city state')
      .populate('medicineId', 'name composition manufacturer imageUrl'),
    Inventory.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      inventory: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    },
  });
});

/**
 * @desc    Get a single inventory item by id, scoped to the authenticated admin's pharmacy
 * @route   GET /api/inventory/:id
 * @access  Private (Admin, own pharmacy only)
 */
const getInventoryItemById = asyncHandler(async (req, res) => {
  const pharmacyId = getOwnPharmacyId(req);

  const item = await Inventory.findOne({ _id: req.params.id, pharmacyId })
    .populate('pharmacyId', 'name city state')
    .populate('medicineId', 'name composition manufacturer imageUrl');

  // Deliberately the same 404 whether the item doesn't exist at all or belongs to
  // another pharmacy - this never confirms to a caller that another pharmacy's
  // batch exists.
  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }

  res.status(200).json({
    success: true,
    data: { inventory: item },
  });
});

/**
 * @desc    Update an inventory item (batch, quantity, price, expiry)
 * @route   PUT /api/inventory/:id
 * @access  Private (Admin, own pharmacy only)
 */
const updateInventoryItem = asyncHandler(async (req, res) => {
  const pharmacyId = getOwnPharmacyId(req);
  const item = await Inventory.findOne({ _id: req.params.id, pharmacyId });

  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }

  const { pharmacyId: _ignoredPharmacyId, medicineId, ...updates } = req.body; // references are never client-editable
  Object.assign(item, updates);
  await item.save(); // triggers pre-save hook to recompute status

  res.status(200).json({
    success: true,
    message: 'Inventory item updated successfully',
    data: { inventory: item },
  });
});

/**
 * @desc    Dashboard summary stats for the authenticated admin's pharmacy -
 *          the Inventory-backed counterpart to medicineController.getDashboardStats,
 *          which only ever reflects the legacy Store+Medicine collection.
 * @route   GET /api/inventory/stats/summary
 * @access  Private (Admin, own pharmacy only)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const pharmacyId = getOwnPharmacyId(req);

  const [totalItems, lowStock, expired, outOfStock] = await Promise.all([
    Inventory.countDocuments({ pharmacyId }),
    Inventory.countDocuments({ pharmacyId, status: 'Low Stock' }),
    Inventory.countDocuments({ pharmacyId, status: 'Expired' }),
    Inventory.countDocuments({ pharmacyId, status: 'Out of Stock' }),
  ]);

  res.status(200).json({
    success: true,
    data: { totalItems, lowStock, expired, outOfStock },
  });
});

/**
 * @desc    Delete an inventory item
 * @route   DELETE /api/inventory/:id
 * @access  Private (Admin, own pharmacy only)
 */
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const pharmacyId = getOwnPharmacyId(req);
  const item = await Inventory.findOne({ _id: req.params.id, pharmacyId });

  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }

  await item.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Inventory item deleted successfully',
  });
});

module.exports = {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  getDashboardStats,
};
