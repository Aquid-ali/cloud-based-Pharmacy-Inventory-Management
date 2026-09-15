const ApiError = require('../utils/ApiError');

// Mirrors inventoryController.js's inline getOwnPharmacyId - every route in
// this feature derives "my pharmacy" strictly from req.user, never from a
// client-supplied pharmacyId in body/params/query.
function getOwnPharmacyId(user) {
  if (user.role !== 'Admin' || !user.pharmacyId) {
    throw new ApiError(403, 'Only pharmacy admins can use the Pharmacy Network');
  }
  return String(user.pharmacyId._id || user.pharmacyId);
}

function sortPair(idA, idB) {
  const [pharmacyLow, pharmacyHigh] = [String(idA), String(idB)].sort();
  return { pharmacyLow, pharmacyHigh };
}

// Shared by both PharmacyConnection and PharmacyConversation docs - both
// shapes carry the same sorted pharmacyLow/pharmacyHigh pair.
function isParticipant(pairDoc, pharmacyId) {
  if (!pairDoc || !pharmacyId) return false;
  const mine = String(pharmacyId);
  return String(pairDoc.pharmacyLow) === mine || String(pairDoc.pharmacyHigh) === mine;
}

function otherPharmacyId(pairDoc, myPharmacyId) {
  const mine = String(myPharmacyId);
  return String(pairDoc.pharmacyLow) === mine ? String(pairDoc.pharmacyHigh) : String(pairDoc.pharmacyLow);
}

module.exports = { getOwnPharmacyId, sortPair, isParticipant, otherPharmacyId };
