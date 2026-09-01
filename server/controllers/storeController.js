const asyncHandler = require('express-async-handler');
const Store = require('../models/Store');

const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;

const haversineDistanceKm = (from, to) => {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/**
 * @desc    List all stores
 * @route   GET /api/stores
 * @access  Private
 */
const getStores = asyncHandler(async (req, res) => {
  const stores = await Store.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: { stores } });
});

/**
 * @desc    List stores sorted by distance from the given coordinates
 * @route   GET /api/stores/nearby?lat=&lng=&limit=
 * @access  Private
 */
const getNearbyStores = asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ success: false, message: 'lat and lng query params are required' });
  }

  const stores = await Store.find();
  const withDistance = stores
    .map((store) => ({
      ...store.toJSON(),
      distanceKm: Math.round(haversineDistanceKm({ lat, lng }, store.location) * 10) / 10,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  res.status(200).json({ success: true, data: { stores: withDistance } });
});

module.exports = { getStores, getNearbyStores };
