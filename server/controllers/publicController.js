const asyncHandler = require('express-async-handler');
const MedicineCatalog = require('../models/MedicineCatalog');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');

/**
 * @desc    Aggregate, non-sensitive counts for the public landing page's trust
 *          section (medicines available, active pharmacies, registered
 *          customers). No PII, no individual records - safe to expose without
 *          authentication. Never invents numbers: each field is a real count,
 *          or 0 if the database is unreachable (degrades gracefully rather
 *          than failing the whole landing page).
 * @route   GET /api/public/stats
 * @access  Public
 */
const getPublicStats = asyncHandler(async (req, res) => {
  try {
    const [totalMedicines, totalPharmacies, totalCustomers] = await Promise.all([
      MedicineCatalog.countDocuments(),
      Pharmacy.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'Customer' }),
    ]);

    res.status(200).json({
      success: true,
      data: { available: true, totalMedicines, totalPharmacies, totalCustomers },
    });
  } catch (error) {
    // The landing page's trust section should never break the page just
    // because the database is briefly unavailable - fall back to
    // available:false so the frontend shows non-numeric trust statements
    // instead (per the "don't invent statistics" requirement).
    res.status(200).json({
      success: true,
      data: { available: false, totalMedicines: 0, totalPharmacies: 0, totalCustomers: 0 },
    });
  }
});

/**
 * @desc    A small preview of real, active pharmacies for the public landing
 *          page's discovery section. Deliberately minimal fields only (name +
 *          location) - no phone/email/owner, which stay behind auth. Never
 *          fabricates ratings, hours, or distance; the client shows only what
 *          is actually returned here.
 * @route   GET /api/public/pharmacies
 * @access  Public
 */
const getPublicPharmacies = asyncHandler(async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ status: 'active' })
      .select('name address city state pincode location createdAt')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({ success: true, data: pharmacies });
  } catch (error) {
    res.status(200).json({ success: true, data: [] });
  }
});

module.exports = { getPublicStats, getPublicPharmacies };
