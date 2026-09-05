/**
 * One-time (idempotent) backfill: geocodes every Pharmacy document that's
 * still missing `location` - pharmacies created before this feature existed,
 * or whose address was set some other way than the admin's Pharmacy Profile
 * page (which now geocodes automatically on every address edit - see
 * pharmacyController.updatePharmacy). Uses the Google Geocoding API and
 * persists the result. Never runs automatically and is never called on a
 * page load - the app always reads the already-persisted `location.lat/lng`
 * at request time. Safe to re-run: pharmacies that already have a location
 * are skipped, so a partial/interrupted run can just be re-run to pick up
 * where it left off.
 *
 * Requires GOOGLE_MAPS_API_KEY in server/.env (a server-side key, IP-restricted,
 * with only the Geocoding API enabled - see README.md "Google Maps Setup").
 *
 * Usage (run from the `server/` directory):
 *   npm run geocode:pharmacies              -> geocodes and saves
 *   npm run geocode:pharmacies -- --dry-run -> reports only, writes nothing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Pharmacy = require('../models/Pharmacy');
const { geocodeAddress } = require('../services/geocodingService');

const isDryRun = process.argv.includes('--dry-run');
const GEOCODE_DELAY_MS = 200; // stays comfortably under Google's default QPS limits

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY is not set in server/.env - nothing to do. See README.md "Google Maps Setup".');
    process.exit(1);
  }

  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('Could not establish a MongoDB connection. Aborting (no changes made).');
    process.exit(1);
  }

  const pharmacies = await Pharmacy.find({
    $or: [{ location: { $exists: false } }, { 'location.lat': { $exists: false } }, { 'location.lng': { $exists: false } }],
  });

  const report = { scanned: pharmacies.length, geocoded: 0, skipped: [] };

  for (const pharmacy of pharmacies) {
    const query = [pharmacy.address, pharmacy.city, pharmacy.state, pharmacy.pincode].filter(Boolean).join(', ');
    const result = await geocodeAddress(pharmacy, apiKey);

    if (result.status !== 'OK') {
      report.skipped.push({ name: pharmacy.name, query, status: result.status, errorMessage: result.errorMessage });
      console.warn(`  ✗ ${pharmacy.name} - could not geocode "${query}" (${result.status}${result.errorMessage ? `: ${result.errorMessage}` : ''})`);
    } else {
      console.log(`  ✓ ${pharmacy.name} -> ${result.lat}, ${result.lng}`);
      report.geocoded += 1;
      if (!isDryRun) {
        pharmacy.location = { lat: result.lat, lng: result.lng };
        await pharmacy.save();
      }
    }

    await sleep(GEOCODE_DELAY_MS);
  }

  console.log('');
  console.log(isDryRun ? 'Pharmacy Geocoding (DRY RUN — no data written)' : 'Pharmacy Geocoding Complete');
  console.log('');
  console.log(`Pharmacies missing a location: ${report.scanned}`);
  console.log(`Successfully geocoded: ${report.geocoded}`);
  console.log(`Skipped (invalid/ungeocodable address): ${report.skipped.length}`);
  if (report.skipped.length > 0) {
    console.log('Skipped (see each reason below - REQUEST_DENIED/OVER_QUERY_LIMIT means fix the API key/billing, not the address; ZERO_RESULTS means fix the address), then re-run this script:');
    report.skipped.forEach((s) =>
      console.log(`  - ${s.name}: "${s.query}" (${s.status}${s.errorMessage ? `: ${s.errorMessage}` : ''})`)
    );
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('Geocoding failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors during failure cleanup
  }
  process.exit(1);
});
