const asyncHandler = require('express-async-handler');
const Medicine = require('../models/Medicine');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Create a new medicine
 * @route   POST /api/medicines
 * @access  Private (Admin, Pharmacist)
 */
const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Medicine created successfully',
    data: { medicine },
  });
});

/**
 * @desc    Get all medicines with search, filter, sort & pagination
 * @route   GET /api/medicines
 * @access  Private
 *
 * Query params:
 *   search    - text search on medicineName / genericName / manufacturer
 *   category  - filter by exact category
 *   expiry    - "expired" | "expiringSoon" (next 30 days) | "valid"
 *   status    - filter by status field
 *   sortBy    - medicineName | expiryDate | quantity | createdAt (default createdAt)
 *   order     - asc | desc (default desc)
 *   page      - default 1
 *   limit     - default 10
 */
const getMedicines = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    expiry,
    status,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};

  if (search) {
    filter.$text = { $search: search };
  }

  if (category) {
    filter.category = category;
  }

  if (status) {
    filter.status = status;
  }

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
  const sortDirection = order === 'asc' ? 1 : -1;

  const [medicines, total] = await Promise.all([
    Medicine.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'fullName email role'),
    Medicine.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      medicines,
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
 * @desc    Get a single medicine by id
 * @route   GET /api/medicines/:id
 * @access  Private
 */
const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id).populate(
    'createdBy',
    'fullName email role'
  );

  if (!medicine) {
    throw new ApiError(404, 'Medicine not found');
  }

  res.status(200).json({
    success: true,
    data: { medicine },
  });
});

/**
 * @desc    Update a medicine
 * @route   PUT /api/medicines/:id
 * @access  Private (Admin, Pharmacist)
 */
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    throw new ApiError(404, 'Medicine not found');
  }

  Object.assign(medicine, req.body);
  await medicine.save(); // triggers pre-save hook to recompute status

  res.status(200).json({
    success: true,
    message: 'Medicine updated successfully',
    data: { medicine },
  });
});

/**
 * @desc    Delete a medicine
 * @route   DELETE /api/medicines/:id
 * @access  Private (Admin only)
 */
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    throw new ApiError(404, 'Medicine not found');
  }

  await medicine.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Medicine deleted successfully',
  });
});

/**
 * @desc    Get dashboard summary stats
 * @route   GET /api/medicines/stats/summary
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const [totalMedicines, lowStock, expired, categories] = await Promise.all([
    Medicine.countDocuments(),
    Medicine.countDocuments({ status: 'Low Stock' }),
    Medicine.countDocuments({ expiryDate: { $lt: now } }),
    Medicine.distinct('category'),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalMedicines,
      lowStock,
      expired,
      totalCategories: categories.length,
    },
  });
});

module.exports = {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getDashboardStats,
};
