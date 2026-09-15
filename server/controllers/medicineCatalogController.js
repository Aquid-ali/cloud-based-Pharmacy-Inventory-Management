const asyncHandler = require('express-async-handler');
const MedicineCatalog = require('../models/MedicineCatalog');
const Inventory = require('../models/Inventory');
const ApiError = require('../utils/ApiError');
const { resolveNewBatchFlags } = require('../services/batchNotificationService');
const { searchCatalog, getAutocompleteSuggestions } = require('../services/medicineSearchService');

// Fields safe to expose to the customer-facing catalog search - excludes
// timestamps and anything not needed by the storefront. latestBatchId is
// fetched (not shown as-is) purely to resolve the "New Batch Added" flag below.
const CUSTOMER_FIELDS = '_id medicineId name composition uses sideEffects imageUrl manufacturer reviewStats latestBatchId';

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
 * @desc    Customer-facing search across name / genericName / brandName /
 *          composition / manufacturer / uses, returning only storefront-safe
 *          fields, ranked by relevance (exact > starts-with > contains >
 *          fuzzy) with typo-tolerant fallback and a "Did you mean" suggestion
 *          when no strong match exists. Matching `uses` means a customer can
 *          search by condition/disease (e.g. "diabetes", "fever") and find
 *          the medicines that treat it, not just medicines whose own name
 *          matches. See server/services/medicineSearchService.js for the
 *          ranking/fuzzy logic shared with pharmacyController.browsePharmacyInventory.
 * @route   GET /api/medicine-catalog/search
 * @access  Public
 *
 * Query params:
 *   q      - search term, optional (empty = browse the full catalog A-Z)
 *   page   - default 1
 *   limit  - default 20 (max 50)
 */
const searchMedicines = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  const { ids, total, suggestion, page: pageNum, limit: limitNum } = await searchCatalog({ q, page, limit });

  const docs = await MedicineCatalog.find({ _id: { $in: ids } }).select(CUSTOMER_FIELDS);
  const docsById = new Map(docs.map((doc) => [String(doc._id), doc]));
  // Re-order to match the rank order searchCatalog already computed - `$in`
  // does not preserve array order.
  const medicines = ids.map((id) => docsById.get(id)).filter(Boolean);

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
      suggestion,
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
 * @desc    Compact autocomplete suggestions for the live search dropdown -
 *          served entirely from an in-memory cache (see medicineSearchService),
 *          never queries `uses`, so this is a pure name-completion dropdown
 *          (condition/disease search still works on the full /search results).
 * @route   GET /api/medicine-catalog/autocomplete
 * @access  Public
 *
 * Query params:
 *   q      - search term
 *   limit  - default 8 (max 8)
 */
const getAutocomplete = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const suggestions = await getAutocompleteSuggestions({ q, limit: limit ? parseInt(limit, 10) : 8 });
  res.status(200).json({ success: true, data: { suggestions } });
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
  getAutocomplete,
  getMedicineById,
  getMedicineAvailability,
  updateMedicine,
  deleteMedicine,
};
