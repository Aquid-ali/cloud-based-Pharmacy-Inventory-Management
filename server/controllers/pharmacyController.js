const asyncHandler = require('express-async-handler');
const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');
const MedicineCatalog = require('../models/MedicineCatalog');
const ApiError = require('../utils/ApiError');
const { resolveNewBatchFlags } = require('../services/batchNotificationService');

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;
const haversineDistanceKm = (from, to) => {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

// Customer-safe projection of an Inventory batch, joined with its catalog medicine
// and pharmacy - never exposes purchasePrice, batchNumber, minimumStock, or the
// raw expiryDate (only a boolean "expiring soon" flag), mirroring the same
// customer-safety rules already used by medicineCatalogController.getMedicineAvailability.
const toCustomerInventoryItem = (item, newBatchFlags) => {
  const soonThreshold = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days out
  return {
    _id: item._id,
    medicine: item.medicineId
      ? {
          _id: item.medicineId._id,
          name: item.medicineId.name,
          composition: item.medicineId.composition,
          manufacturer: item.medicineId.manufacturer,
          imageUrl: item.medicineId.imageUrl,
          newBatch: newBatchFlags.get(item.medicineId._id.toString()) || false,
        }
      : null,
    pharmacy: item.pharmacyId
      ? { _id: item.pharmacyId._id, name: item.pharmacyId.name, city: item.pharmacyId.city, state: item.pharmacyId.state }
      : null,
    quantity: item.quantity,
    sellingPrice: item.sellingPrice,
    status: item.status,
    expiringSoon: new Date(item.expiryDate).getTime() <= soonThreshold,
  };
};

/**
 * @desc    Create a new pharmacy, owned by the authenticated user
 * @route   POST /api/pharmacies
 * @access  Private (Admin)
 */
const createPharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.create({
    ...req.body,
    ownerId: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Pharmacy created successfully',
    data: { pharmacy },
  });
});

/**
 * @desc    Get all pharmacies with search, filter & pagination
 * @route   GET /api/pharmacies
 * @access  Private
 *
 * Query params:
 *   search   - case-insensitive search on name
 *   city     - filter by exact city
 *   state    - filter by exact state
 *   status   - active | inactive
 *   page     - default 1
 *   limit    - default 10
 */
const getPharmacies = asyncHandler(async (req, res) => {
  const { search, city, state, status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (city) filter.city = city;
  if (state) filter.state = state;
  if (status) filter.status = status;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [pharmacies, total] = await Promise.all([
    Pharmacy.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('ownerId', 'fullName email role'),
    Pharmacy.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      pharmacies,
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
 * @desc    List active pharmacies sorted by distance from the given coordinates.
 *          Pharmacies without a recorded location can't be distance-sorted, so
 *          they're excluded rather than shown with a meaningless distance.
 * @route   GET /api/pharmacies/nearby?lat=&lng=&limit=
 * @access  Private
 */
const getNearbyPharmacies = asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ApiError(400, 'lat and lng query params are required');
  }

  const pharmacies = await Pharmacy.find({
    status: 'active',
    'location.lat': { $exists: true },
    'location.lng': { $exists: true },
  });

  const withDistance = pharmacies
    .map((pharmacy) => ({
      ...pharmacy.toJSON(),
      distanceKm: Math.round(haversineDistanceKm({ lat, lng }, pharmacy.location) * 10) / 10,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  res.status(200).json({ success: true, data: { pharmacies: withDistance } });
});

/**
 * @desc    Customer-facing browse of live pharmacy stock - either one pharmacy's
 *          (?pharmacyId=) or aggregated across every active pharmacy. Backed by
 *          Inventory + MedicineCatalog, so it reflects Add Stock changes immediately.
 *          Never exposes purchasePrice/batchNumber/minimumStock (see toCustomerInventoryItem).
 * @route   GET /api/pharmacies/browse-inventory?pharmacyId=&search=&page=&limit=
 * @access  Private
 */
const browsePharmacyInventory = asyncHandler(async (req, res) => {
  const { pharmacyId, search, page = 1, limit = 20 } = req.query;

  const filter = { status: { $ne: 'Expired' } };

  if (pharmacyId) {
    const pharmacy = await Pharmacy.findOne({ _id: pharmacyId, status: 'active' });
    if (!pharmacy) {
      throw new ApiError(404, 'Pharmacy not found');
    }
    filter.pharmacyId = pharmacyId;
  } else {
    const activePharmacies = await Pharmacy.find({ status: 'active' }, { _id: 1 }).lean();
    filter.pharmacyId = { $in: activePharmacies.map((p) => p._id) };
  }

  if (search && search.trim()) {
    // Word-by-word, matched across name/genericName/composition/manufacturer/uses
    // (mirrors medicineCatalogController.searchMedicines) - so searching a
    // condition/disease name (e.g. "diabetes") surfaces medicines that treat
    // it via their `uses` text, not just medicines whose own name matches.
    const words = search.trim().split(/\s+/).filter(Boolean);
    const catalogFilter = {
      $and: words.map((word) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        return {
          $or: [{ name: regex }, { genericName: regex }, { composition: regex }, { manufacturer: regex }, { uses: regex }],
        };
      }),
    };
    const matches = await MedicineCatalog.find(catalogFilter, { _id: 1 }).limit(500).lean();
    filter.medicineId = { $in: matches.map((m) => m._id) };
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('medicineId', 'name composition manufacturer imageUrl latestBatchId')
      .populate('pharmacyId', 'name city state'),
    Inventory.countDocuments(filter),
  ]);

  const newBatchFlags = await resolveNewBatchFlags(
    req.user?._id,
    items.filter((i) => i.medicineId).map((i) => ({ medicineId: i.medicineId._id, latestBatchId: i.medicineId.latestBatchId }))
  );

  res.status(200).json({
    success: true,
    data: {
      inventory: items.map((item) => toCustomerInventoryItem(item, newBatchFlags)),
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
 * @desc    Get a single pharmacy by id
 * @route   GET /api/pharmacies/:id
 * @access  Private
 */
const getPharmacyById = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.params.id).populate('ownerId', 'fullName email role');

  if (!pharmacy) {
    throw new ApiError(404, 'Pharmacy not found');
  }

  res.status(200).json({
    success: true,
    data: { pharmacy },
  });
});

/**
 * @desc    Update a pharmacy
 * @route   PUT /api/pharmacies/:id
 * @access  Private (Admin, owner only)
 */
const updatePharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.params.id);

  if (!pharmacy) {
    throw new ApiError(404, 'Pharmacy not found');
  }

  if (!pharmacy.ownerId.equals(req.user._id)) {
    throw new ApiError(403, 'You can only manage pharmacies you own');
  }

  const { ownerId, pharmacyId, ...updates } = req.body; // ownerId/pharmacyId are never client-editable
  Object.assign(pharmacy, updates);
  await pharmacy.save();

  res.status(200).json({
    success: true,
    message: 'Pharmacy updated successfully',
    data: { pharmacy },
  });
});

/**
 * @desc    Delete a pharmacy
 * @route   DELETE /api/pharmacies/:id
 * @access  Private (Admin, owner only)
 */
const deletePharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.params.id);

  if (!pharmacy) {
    throw new ApiError(404, 'Pharmacy not found');
  }

  if (!pharmacy.ownerId.equals(req.user._id)) {
    throw new ApiError(403, 'You can only manage pharmacies you own');
  }

  await pharmacy.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Pharmacy deleted successfully',
  });
});

module.exports = {
  createPharmacy,
  getPharmacies,
  getNearbyPharmacies,
  browsePharmacyInventory,
  getPharmacyById,
  updatePharmacy,
  deletePharmacy,
};
