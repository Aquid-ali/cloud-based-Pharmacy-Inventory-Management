const asyncHandler = require('express-async-handler');
const MedicineCatalog = require('../models/MedicineCatalog');
const Inventory = require('../models/Inventory');
const ApiError = require('../utils/ApiError');
const { resolveNewBatchFlags } = require('../services/batchNotificationService');

// Fields safe to expose to the customer-facing catalog search - excludes
// timestamps and anything not needed by the storefront. latestBatchId is
// fetched (not shown as-is) purely to resolve the "New Batch Added" flag below.
const CUSTOMER_FIELDS = '_id medicineId name composition uses sideEffects imageUrl manufacturer reviewStats latestBatchId';

// Fields searchMedicines matches against - includes `uses` so a customer can
// find a medicine by the condition/disease it treats (e.g. searching
// "diabetes" or "fever"), not just by the medicine's own name.
const SEARCH_FIELDS = ['name', 'genericName', 'composition', 'manufacturer', 'uses'];

/**
 * @desc    Add a new medicine to the master catalog
 * @route   POST /api/medicine-catalog
 * @access  Private (Admin)
 */
const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await MedicineCatalog.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Medicine added to catalog successfully',
    data: { medicine },
  });
});

/**
 * @desc    Customer-facing search across name / genericName / composition /
 *          manufacturer / uses, returning only storefront-safe fields.
 *          Matching `uses` means a customer can search by condition/disease
 *          (e.g. "diabetes", "fever") and find the medicines that treat it,
 *          not just medicines whose own name matches.
 * @route   GET /api/medicine-catalog/search
 * @access  Public
 *
 * Query params:
 *   q      - search term. Split into words; a medicine matches only if EVERY
 *            word is found in at least one of SEARCH_FIELDS (case-insensitive,
 *            substring match) - so "fever tablet" matches a medicine whose
 *            name contains "tablet" and whose uses contains "fever", even if
 *            neither field alone contains the full phrase.
 *   page   - default 1
 *   limit  - default 20 (max 50)
 */
const searchMedicines = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (q && q.trim()) {
    const words = q.trim().split(/\s+/).filter(Boolean);
    filter.$and = words.map((word) => {
      // Escape regex metacharacters so user input can't build an unintended pattern
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      return { $or: SEARCH_FIELDS.map((field) => ({ [field]: regex })) };
    });
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [medicines, total] = await Promise.all([
    MedicineCatalog.find(filter).select(CUSTOMER_FIELDS).sort({ name: 1 }).skip(skip).limit(limitNum),
    MedicineCatalog.countDocuments(filter),
  ]);

  const newBatchFlags = await resolveNewBatchFlags(
    req.user?._id,
    medicines.map((m) => ({ medicineId: m._id, latestBatchId: m.latestBatchId }))
  );
  const medicinesWithFlag = medicines.map((m) => {
    const { latestBatchId, ...rest } = m.toObject();
    return { ...rest, newBatch: newBatchFlags.get(m._id.toString()) || false };
  });

  res.status(200).json({
    success: true,
    data: {
      medicines: medicinesWithFlag,
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
 * @desc    Get all catalog medicines with search, filter & pagination
 * @route   GET /api/medicine-catalog
 * @access  Private
 *
 * Query params:
 *   search       - text search on name / composition / manufacturer
 *   manufacturer - filter by exact manufacturer
 *   page         - default 1
 *   limit        - default 10
 */
const getMedicines = asyncHandler(async (req, res) => {
  const { search, manufacturer, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (search) filter.$text = { $search: search };
  if (manufacturer) filter.manufacturer = manufacturer;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [medicines, total] = await Promise.all([
    MedicineCatalog.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum),
    MedicineCatalog.countDocuments(filter),
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
 * @desc    Get a single catalog medicine by id
 * @route   GET /api/medicine-catalog/:id
 * @access  Public
 */
const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await MedicineCatalog.findById(req.params.id);

  if (!medicine) {
    throw new ApiError(404, 'Medicine not found in catalog');
  }

  res.status(200).json({
    success: true,
    data: { medicine },
  });
});

/**
 * @desc    Find pharmacies that currently stock a catalog medicine, aggregated
 *          from Inventory batches (excluding expired stock)
 * @route   GET /api/medicine-catalog/:id/availability
 * @access  Public
 */
const getMedicineAvailability = asyncHandler(async (req, res) => {
  const medicine = await MedicineCatalog.findById(req.params.id).select('name');
  if (!medicine) {
    throw new ApiError(404, 'Medicine not found in catalog');
  }

  const batches = await Inventory.find({
    medicineId: req.params.id,
    status: { $ne: 'Expired' },
  }).populate('pharmacyId', 'name address city state status');

  const statusRank = { 'In Stock': 0, 'Low Stock': 1, 'Out of Stock': 2 };
  const soonThreshold = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days out

  // Merge multiple batches held by the same active pharmacy into one row
  const byPharmacy = new Map();
  for (const batch of batches) {
    const pharmacy = batch.pharmacyId;
    if (!pharmacy || pharmacy.status !== 'active') continue;

    const key = pharmacy._id.toString();
    const expiringSoon = batch.expiryDate <= soonThreshold;
    const existing = byPharmacy.get(key);

    if (!existing) {
      byPharmacy.set(key, {
        // Needed so the customer can actually order from this pharmacy -
        // purchasePrice/batchNumber/minimumStock stay hidden, but the
        // pharmacy's own identity is no longer "unnecessary" once ordering
        // is the point.
        pharmacyId: pharmacy._id,
        pharmacyName: pharmacy.name,
        address: pharmacy.address,
        city: pharmacy.city,
        state: pharmacy.state,
        quantity: batch.quantity,
        sellingPrice: batch.sellingPrice,
        status: batch.status,
        expiringSoon,
      });
    } else {
      existing.quantity += batch.quantity;
      existing.sellingPrice = Math.min(existing.sellingPrice, batch.sellingPrice);
      existing.expiringSoon = existing.expiringSoon || expiringSoon;
      if (statusRank[batch.status] < statusRank[existing.status]) {
        existing.status = batch.status;
      }
    }
  }

  const pharmacies = Array.from(byPharmacy.values()).sort((a, b) => a.sellingPrice - b.sellingPrice);

  res.status(200).json({
    success: true,
    data: { medicineName: medicine.name, pharmacies },
  });
});

/**
 * @desc    Update a catalog medicine
 * @route   PUT /api/medicine-catalog/:id
 * @access  Private (Admin)
 */
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await MedicineCatalog.findById(req.params.id);

  if (!medicine) {
    throw new ApiError(404, 'Medicine not found in catalog');
  }

  const { medicineId, ...updates } = req.body; // medicineId is never client-editable
  Object.assign(medicine, updates);
  await medicine.save();

  res.status(200).json({
    success: true,
    message: 'Medicine updated successfully',
    data: { medicine },
  });
});

/**
 * @desc    Delete a catalog medicine
 * @route   DELETE /api/medicine-catalog/:id
 * @access  Private (Admin)
 */
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await MedicineCatalog.findById(req.params.id);

  if (!medicine) {
    throw new ApiError(404, 'Medicine not found in catalog');
  }

  await medicine.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Medicine deleted successfully',
  });
});

module.exports = {
  createMedicine,
  getMedicines,
  searchMedicines,
  getMedicineById,
  getMedicineAvailability,
  updateMedicine,
  deleteMedicine,
};
