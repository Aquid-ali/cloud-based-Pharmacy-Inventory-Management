const asyncHandler = require('express-async-handler');
const { parse } = require('csv-parse/sync');
const Medicine = require('../models/Medicine');
const ApiError = require('../utils/ApiError');

// This whole controller manages the legacy, per-store Medicine collection, which
// only Admins with a `store` (not the newer pharmacy-scoped Admins) can own data
// in. Write operations reject pharmacy-scoped admins outright; read endpoints
// degrade gracefully (empty/zeroed results) since they're hit automatically on
// page load and a hard error there is a worse experience than "you have none".
const requireStoreId = (req) => {
  if (!req.user.store) {
    throw new ApiError(403, 'Your account is not associated with a store');
  }
  return req.user.store._id;
};

const IMPORT_REQUIRED_FIELDS = [
  'medicineName',
  'manufacturer',
  'category',
  'batchNumber',
  'expiryDate',
  'quantity',
  'purchasePrice',
  'sellingPrice',
];
const IMPORT_MAX_ROWS = 20000;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const parseNonNegativeNumber = (value) => {
  if (isBlank(value)) return null;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : NaN;
};

/**
 * Validates and normalizes a single CSV row.
 * Returns { errors: string[], data: object } - data is only reliable when errors is empty.
 */
const validateImportRow = (row) => {
  const errors = [];

  IMPORT_REQUIRED_FIELDS.forEach((field) => {
    if (isBlank(row[field])) errors.push(`${field} is required`);
  });

  const medicineName = String(row.medicineName || '').trim();
  const genericName = String(row.genericName || '').trim();
  const manufacturer = String(row.manufacturer || '').trim();
  const category = String(row.category || '').trim();
  const batchNumber = String(row.batchNumber || '').trim();
  const description = String(row.description || '').trim();

  let expiryDate = null;
  if (!isBlank(row.expiryDate)) {
    const parsedDate = new Date(row.expiryDate);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push(`invalid expiryDate: "${row.expiryDate}"`);
    } else {
      expiryDate = parsedDate;
    }
  }

  const quantity = parseNonNegativeNumber(row.quantity);
  if (!isBlank(row.quantity) && Number.isNaN(quantity)) {
    errors.push(`invalid quantity: "${row.quantity}"`);
  }

  const purchasePrice = parseNonNegativeNumber(row.purchasePrice);
  if (!isBlank(row.purchasePrice) && Number.isNaN(purchasePrice)) {
    errors.push(`invalid purchasePrice: "${row.purchasePrice}"`);
  }

  const sellingPrice = parseNonNegativeNumber(row.sellingPrice);
  if (!isBlank(row.sellingPrice) && Number.isNaN(sellingPrice)) {
    errors.push(`invalid sellingPrice: "${row.sellingPrice}"`);
  }

  let reorderLevel;
  if (!isBlank(row.reorderLevel)) {
    reorderLevel = parseNonNegativeNumber(row.reorderLevel);
    if (Number.isNaN(reorderLevel)) errors.push(`invalid reorderLevel: "${row.reorderLevel}"`);
  }

  return {
    errors,
    data: {
      medicineName,
      genericName: genericName || undefined,
      manufacturer,
      category,
      batchNumber,
      expiryDate,
      quantity,
      buyingPrice: purchasePrice,
      sellingPrice,
      reorderLevel: Number.isFinite(reorderLevel) ? reorderLevel : undefined,
      description: description || undefined,
    },
  };
};

/**
 * @desc    Create a new medicine
 * @route   POST /api/medicines
 * @access  Private (Admin)
 */
const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.create({
    ...req.body,
    createdBy: req.user._id,
    store: requireStoreId(req),
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
    store,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};

  // Admins only ever see their own store's medicines; customers may
  // optionally filter by a store they've chosen to shop from. A pharmacy-scoped
  // admin has no store, so they simply have no legacy medicines - not an error.
  if (req.user.role === 'Admin') {
    if (!req.user.store) {
      return res.status(200).json({
        success: true,
        data: { medicines: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } },
      });
    }
    filter.store = req.user.store._id;
  } else if (store) {
    filter.store = store;
  }

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
      .populate('createdBy', 'fullName email role')
      .populate('store', 'name address'),
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
  const medicine = await Medicine.findById(req.params.id)
    .populate('createdBy', 'fullName email role')
    .populate('store', 'name address');

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
 * @access  Private (Admin)
 */
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    throw new ApiError(404, 'Medicine not found');
  }

  if (!medicine.store.equals(requireStoreId(req))) {
    throw new ApiError(403, 'You can only manage medicines belonging to your own store');
  }

  const { store, ...updates } = req.body; // store is never client-editable
  Object.assign(medicine, updates);
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

  if (!medicine.store.equals(requireStoreId(req))) {
    throw new ApiError(403, 'You can only manage medicines belonging to your own store');
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
  // A pharmacy-scoped admin has no legacy store, so has no legacy medicines -
  // return zeroed stats rather than erroring on their first page after login.
  if (req.user.role === 'Admin' && !req.user.store) {
    return res.status(200).json({
      success: true,
      data: { totalMedicines: 0, lowStock: 0, expired: 0, totalCategories: 0 },
    });
  }

  const now = new Date();
  const scope = req.user.role === 'Admin' ? { store: req.user.store._id } : {};

  const [totalMedicines, lowStock, expired, categories] = await Promise.all([
    Medicine.countDocuments(scope),
    Medicine.countDocuments({ ...scope, status: 'Low Stock' }),
    Medicine.countDocuments({ ...scope, expiryDate: { $lt: now } }),
    Medicine.distinct('category', scope),
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

/**
 * @desc    Bulk-import medicines from a CSV file into the admin's own store.
 *          The CSV is parsed and re-validated server-side (client-side checks
 *          are a UX convenience only, never trusted). Valid rows are inserted
 *          with Medicine.insertMany for performance on large files; rows that
 *          are invalid or duplicate an existing/in-file record are skipped and
 *          reported back individually.
 * @route   POST /api/medicines/import
 * @access  Private (Admin)
 */
const importMedicines = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No CSV file was uploaded');
  }

  let records;
  try {
    records = parse(req.file.buffer, {
      columns: (header) => header.map((h) => h.trim()),
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (error) {
    throw new ApiError(400, `Could not parse CSV file: ${error.message}`);
  }

  if (records.length === 0) {
    throw new ApiError(400, 'The CSV file has no data rows');
  }

  if (records.length > IMPORT_MAX_ROWS) {
    throw new ApiError(400, `CSV exceeds the maximum of ${IMPORT_MAX_ROWS} rows per import`);
  }

  const storeId = requireStoreId(req);

  // Existing (medicineName, batchNumber) pairs for this store, used to skip duplicates.
  const existingMedicines = await Medicine.find({ store: storeId }, 'medicineName batchNumber').lean();
  const existingKeys = new Set(
    existingMedicines.map((m) => `${m.medicineName.toLowerCase()}|${m.batchNumber.toLowerCase()}`)
  );

  const seenInFile = new Set();
  const toInsert = [];
  const failed = [];
  const duplicates = [];

  records.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for the header row
    const { errors, data } = validateImportRow(row);

    if (errors.length > 0) {
      failed.push({ row: rowNumber, medicineName: data.medicineName || row.medicineName || '(blank)', errors });
      return;
    }

    const key = `${data.medicineName.toLowerCase()}|${data.batchNumber.toLowerCase()}`;

    if (existingKeys.has(key) || seenInFile.has(key)) {
      duplicates.push({ row: rowNumber, medicineName: data.medicineName, batchNumber: data.batchNumber });
      return;
    }

    seenInFile.add(key);
    toInsert.push({
      ...data,
      status: Medicine.computeStatus(data),
      createdBy: req.user._id,
      store: storeId,
    });
  });

  let insertedCount = 0;
  if (toInsert.length > 0) {
    try {
      const inserted = await Medicine.insertMany(toInsert, { ordered: false });
      insertedCount = inserted.length;
    } catch (error) {
      // insertMany with ordered:false still attempts every doc; Mongoose reports
      // the ones that made it through via error.insertedDocs and the rest via writeErrors.
      insertedCount = error.insertedDocs?.length || 0;
      const writeErrors = error.writeErrors || [];
      writeErrors.forEach((writeError) => {
        const failedDoc = toInsert[writeError.index];
        failed.push({
          row: null,
          medicineName: failedDoc?.medicineName || '(unknown)',
          errors: [writeError.errmsg || writeError.message || 'Failed to insert this record'],
        });
      });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Import completed',
    data: {
      summary: {
        totalRows: records.length,
        imported: insertedCount,
        skippedDuplicates: duplicates.length,
        failed: failed.length,
      },
      duplicates,
      errors: failed,
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
  importMedicines,
};
