/**
 * Shared demo-pharmacy definitions + deterministic id helper, used by BOTH
 * seedDemoPharmacies.js and seedDemoPharmacyAdmins.js so they always agree on
 * exactly which Mongo _id a given pharmacy/admin pair resolves to - whichever
 * of the two scripts happens to run first.
 *
 * Why deterministic ids: Pharmacy.ownerId is a required ref to a User, and
 * User.pharmacyId (when set) is a ref to a Pharmacy - each side needs the
 * other's _id to exist as a valid reference. Rather than requiring one script
 * to run before the other (or writing a placeholder/owner-less document that
 * a second pass has to go back and repair), each script independently derives
 * the same stable _id from a fixed seed string, so both documents can be
 * created in either order and always end up correctly cross-referenced.
 */

const crypto = require('crypto');
const mongoose = require('mongoose');

// Deterministic, stable ObjectId derived from a seed string (same seed always
// produces the same id, in this process or any other). Not for security use -
// just a stand-in for "an id we can both agree on in advance".
function deterministicObjectId(seed) {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  return new mongoose.Types.ObjectId(hash.slice(0, 24));
}

const DEMO_PHARMACIES = [
  {
    name: 'MedStock Pharmacy - Connaught Place',
    address: 'Block A, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '+91 11 4000 5001',
    email: 'connaughtplace@medstockpharmacy.in',
    adminEmail: 'admin.cp@medstock.demo',
    location: { lat: 28.6315, lng: 77.2167 },
  },
  {
    name: 'MedStock Pharmacy - Noida',
    address: 'Sector 18, Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    phone: '+91 120 400 5002',
    email: 'noida@medstockpharmacy.in',
    adminEmail: 'admin.noida@medstock.demo',
    location: { lat: 28.5708, lng: 77.326 },
  },
  {
    name: 'MedStock Pharmacy - Indiranagar',
    address: '100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    phone: '+91 80 4000 5003',
    email: 'indiranagar@medstockpharmacy.in',
    adminEmail: 'admin.indiranagar@medstock.demo',
    location: { lat: 12.9719, lng: 77.6412 },
  },
  {
    name: 'MedStock Pharmacy - Koramangala',
    address: '80 Feet Road, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    phone: '+91 80 4000 5004',
    email: 'koramangala@medstockpharmacy.in',
    adminEmail: 'admin.koramangala@medstock.demo',
    location: { lat: 12.9352, lng: 77.6245 },
  },
  {
    name: 'MedStock Pharmacy - Hyderabad Central',
    address: 'Abids Road, Hyderabad Central',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    phone: '+91 40 4000 5005',
    email: 'hyderabad@medstockpharmacy.in',
    adminEmail: 'admin.hyderabad@medstock.demo',
    location: { lat: 17.385, lng: 78.4747 },
  },
];

const DEMO_ADMIN_PASSWORD = 'MedStock@Demo123';

// Every definition's paired, deterministic (pharmacyId, adminId) - computed once
// so both seed scripts import the exact same values instead of recomputing
// (and risking a typo/drift) in two places.
const DEMO_PHARMACY_ENTRIES = DEMO_PHARMACIES.map((def) => ({
  ...def,
  pharmacyId: deterministicObjectId(`demo-pharmacy:${def.name}`),
  adminId: deterministicObjectId(`demo-pharmacy-admin:${def.adminEmail}`),
}));

module.exports = { DEMO_PHARMACY_ENTRIES, DEMO_ADMIN_PASSWORD, deterministicObjectId };
