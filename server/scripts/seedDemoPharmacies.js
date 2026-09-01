/**
 * One-time DEMO seeder that creates 5 realistic demo Pharmacy documents.
 *
 * Usage (run from the `server/` directory):
 *   npm run seed:pharmacies              -> creates the pharmacies
 *   npm run seed:pharmacies -- --dry-run -> reports what would be created, writes nothing
 *
 * Safety:
 *   - Only ever calls Pharmacy.create() for pharmacies that don't already exist
 *     (matched by a deterministic id derived from the pharmacy name - see
 *     demoPharmacyData.js). Never updates or deletes an existing pharmacy's
 *     name/address/contact fields - the one exception is backfilling `location`
 *     (added after the initial release of this script) onto an already-seeded
 *     pharmacy that doesn't have it yet, so re-running after an upgrade still
 *     converges to the current DEMO_PHARMACY_ENTRIES shape.
 *   - Never touches any other collection.
 *   - Each pharmacy's `ownerId` is set to the deterministic id of its paired demo
 *     admin (see seedDemoPharmacyAdmins.js). That User document does not need to
 *     exist yet for this to succeed - Mongoose refs aren't enforced as foreign
 *     keys - so this script and seedDemoPharmacyAdmins.js may be run in either
 *     order and will converge to the same, correctly cross-referenced result.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const { connectDB } = require('../config/db');
const Pharmacy = require('../models/Pharmacy');
const { DEMO_PHARMACY_ENTRIES } = require('./demoPharmacyData');

const isDryRun = process.argv.includes('--dry-run');

async function run() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('Could not establish a MongoDB connection. Aborting (no changes made).');
    process.exit(1);
  }

  const created = [];
  const skipped = [];
  const backfilled = [];

  for (const entry of DEMO_PHARMACY_ENTRIES) {
    const existing = await Pharmacy.findById(entry.pharmacyId).lean();

    if (existing) {
      const needsLocationBackfill = !existing.location?.lat && !!entry.location;
      if (needsLocationBackfill) {
        if (!isDryRun) {
          await Pharmacy.updateOne({ _id: entry.pharmacyId }, { $set: { location: entry.location } });
        }
        backfilled.push(entry.name);
      } else {
        skipped.push(entry.name);
      }
      continue;
    }

    if (isDryRun) {
      created.push(entry.name);
      continue;
    }

    await Pharmacy.create({
      _id: entry.pharmacyId,
      name: entry.name,
      address: entry.address,
      city: entry.city,
      state: entry.state,
      pincode: entry.pincode,
      phone: entry.phone,
      email: entry.email,
      ownerId: entry.adminId,
      status: 'active',
      location: entry.location,
    });
    created.push(entry.name);
  }

  console.log('');
  console.log(isDryRun ? 'Demo Pharmacy Seeding (DRY RUN — no data written)' : 'Demo Pharmacy Seeding Complete');
  console.log('');
  console.log(`Pharmacies created: ${created.length}`);
  created.forEach((name) => console.log(`  + ${name}`));
  console.log(`Pharmacies backfilled with location: ${backfilled.length}`);
  backfilled.forEach((name) => console.log(`  ~ ${name}`));
  console.log(`Pharmacies skipped (already up to date): ${skipped.length}`);
  skipped.forEach((name) => console.log(`  = ${name}`));

  if (!isDryRun) {
    console.log('');
    console.log('Next step: npm run seed:pharmacy-admins  (creates each pharmacy\'s dedicated admin login)');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('Demo pharmacy seeding failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors during failure cleanup
  }
  process.exit(1);
});
