const asyncHandler = require('express-async-handler');
const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');
const PharmacyConnection = require('../models/PharmacyConnection');
const PharmacyConversation = require('../models/PharmacyConversation');
const ApiError = require('../utils/ApiError');
const { getOwnPharmacyId, sortPair } = require('../services/pharmacyNetworkAuth');

// Only ever exposes fields a pharmacy would reasonably want another business
// to see - never street address/pincode, ownerId, or anything from
// Inventory beyond the two aggregate counts computed below.
const PUBLIC_FIELDS = 'name pharmacyId city state phone email status isVerified createdAt';

const toConnectionSummary = (connection, myPharmacyId) => {
  if (!connection) return null;
  return {
    _id: connection._id,
    status: connection.status,
    requestedByMe: String(connection.requestedBy) === String(myPharmacyId),
    blockedByMe: connection.status === 'blocked' && String(connection.blockedBy) === String(myPharmacyId),
  };
};

/**
 * @desc    Compute {productCount, categoryCount} for a pharmacy's live,
 *          non-expired inventory. productCount = distinct medicines carried;
 *          categoryCount = distinct dosageForm values across those medicines
 *          (MedicineCatalog has no dedicated category field).
 */
const getInventoryStatsFor = async (pharmacyId) => {
  const items = await Inventory.find({ pharmacyId, status: { $ne: 'Expired' } }, { medicineId: 1 })
    .populate('medicineId', 'dosageForm')
    .lean();

  const medicineIds = new Set();
  const dosageForms = new Set();
  items.forEach((item) => {
    if (!item.medicineId) return;
    medicineIds.add(String(item.medicineId._id));
    if (item.medicineId.dosageForm) dosageForms.add(item.medicineId.dosageForm);
  });

  return { productCount: medicineIds.size, categoryCount: dosageForms.size };
};

/**
 * @desc    Browse other pharmacies to connect/message with - search/filter +
 *          pagination, never loads every pharmacy into the browser at once.
 *          Always excludes the caller's own pharmacy and inactive pharmacies.
 * @route   GET /api/pharmacy-network/pharmacies
 * @access  Private (Admin, pharmacy-scoped)
 */
const discoverPharmacies = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const { search, city, state, verified, page = 1, limit = 12 } = req.query;

  const filter = { _id: { $ne: myPharmacyId }, status: 'active' };
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (city) filter.city = { $regex: `^${city}$`, $options: 'i' };
  if (state) filter.state = { $regex: `^${state}$`, $options: 'i' };
  if (verified !== undefined) filter.isVerified = verified === 'true';

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [pharmacies, total] = await Promise.all([
    Pharmacy.find(filter, PUBLIC_FIELDS).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
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
 * @desc    Public-safe profile of another pharmacy, plus the caller's own
 *          connection state with them (null if never connected).
 * @route   GET /api/pharmacy-network/pharmacies/:id
 * @access  Private (Admin, pharmacy-scoped)
 */
const getPharmacyProfile = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const targetId = req.params.id;

  if (String(targetId) === String(myPharmacyId)) {
    throw new ApiError(400, 'This is your own pharmacy');
  }

  const pharmacy = await Pharmacy.findById(targetId, PUBLIC_FIELDS).lean();
  if (!pharmacy) {
    throw new ApiError(404, 'Pharmacy not found');
  }

  const stats = await getInventoryStatsFor(targetId);

  const { pharmacyLow, pharmacyHigh } = sortPair(myPharmacyId, targetId);
  const connectionDoc = await PharmacyConnection.findOne({ pharmacyLow, pharmacyHigh });
  const connection = toConnectionSummary(connectionDoc, myPharmacyId);

  if (connection && connectionDoc.status === 'accepted') {
    const conversation = await PharmacyConversation.findOne({ connectionId: connectionDoc._id }, { _id: 1 }).lean();
    if (conversation) connection.conversationId = conversation._id;
  }

  res.status(200).json({ success: true, data: { pharmacy, stats, connection } });
});

module.exports = { discoverPharmacies, getPharmacyProfile, getInventoryStatsFor, toConnectionSummary };
