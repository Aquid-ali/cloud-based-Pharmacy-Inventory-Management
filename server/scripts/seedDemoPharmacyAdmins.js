/**
 * One-time DEMO seeder that creates one dedicated Pharmacy Admin user per demo
 * pharmacy (see demoPharmacyData.js), then prints a User -> Pharmacy
 * verification report so it's obvious every admin is scoped to exactly one
 * pharmacy.
 *
 * Usage (run from the `server/` directory):
 *   npm run seed:pharmacy-admins              -> creates the admin accounts
 *   npm run seed:pharmacy-admins -- --dry-run -> reports what would be created, writes nothing
 *
 * Safety:
 *   - Only ever calls User.create() for emails that don't already exist. Never
 *     updates or deletes an existing user, and never touches any other user's
 *     password.
 *   - Uses the existing User model / bcrypt password hashing - no new auth system.
 *   - Each admin's `pharmacyId` is set to the deterministic id of its paired demo
 *     pharmacy (see seedDemoPharmacies.js). That Pharmacy document does not need
 *     to exist yet for this to succeed - see demoPharmacyData.js for why - so
 *     this script and seedDemoPharmacies.js may be run in either order.
 *   - Every admin gets a distinct pharmacyId (never the same one twice).
 */

require('dotenv').config();
const mongoose = require('mongoose');

const { connectDB } = require('../config/db');
const User = require('../models/User');
require('../models/Pharmacy'); // registers the 'Pharmacy' model so .populate('pharmacyId') below can resolve it
const { DEMO_PHARMACY_ENTRIES, DEMO_ADMIN_PASSWORD } = require('./demoPharmacyData');

const isDryRun = process.argv.includes('--dry-run');

async function run() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('Could not establish a MongoDB connection. Aborting (no changes made).');
    process.exit(1);
  }

  const created = [];
  const skipped = [];

  for (const entry of DEMO_PHARMACY_ENTRIES) {
    const existing = await User.findOne({ email: entry.adminEmail }).lean();
    if (existing) {
      skipped.push(entry.adminEmail);
      continue;
    }

    if (isDryRun) {
      created.push(entry.adminEmail);
      continue;
    }

    await User.create({
      _id: entry.adminId,
      fullName: `${entry.name} Admin`,
      email: entry.adminEmail,
      password: DEMO_ADMIN_PASSWORD,
      role: 'Admin',
      pharmacyId: entry.pharmacyId,
    });
    created.push(entry.adminEmail);
  }

  console.log('');
  console.log(isDryRun ? 'Demo Pharmacy Admin Seeding (DRY RUN — no data written)' : 'Demo Pharmacy Admin Seeding Complete');
  console.log('');
  console.log(`Admins created: ${created.length}`);
  created.forEach((email) => console.log(`  + ${email}`));
  console.log(`Admins skipped (already existed): ${skipped.length}`);
  skipped.forEach((email) => console.log(`  = ${email}`));

  if (!isDryRun) {
    console.log('');
    console.log(`Demo login credentials (all share one password): ${DEMO_ADMIN_PASSWORD}`);
    console.log('');
    console.log('User -> Pharmacy verification:');
    for (const entry of DEMO_PHARMACY_ENTRIES) {
      const admin = await User.findOne({ email: entry.adminEmail }).populate('pharmacyId', 'name');
      if (!admin) {
        console.log(`  ${entry.adminEmail}\n    -> NOT FOUND (creation may have failed)`);
        continue;
      }
      const pharmacyName = admin.pharmacyId ? admin.pharmacyId.name : '(pharmacy not seeded yet)';
      const pharmacyIdStr = admin.pharmacyId ? admin.pharmacyId._id : admin.pharmacyId;
      console.log(`  ${admin.email}`);
      console.log(`    -> ${admin.role}`);
      console.log(`    -> ${pharmacyName}`);
      console.log(`    -> ${pharmacyIdStr}`);
    }

    const distinctPharmacyIds = new Set(
      (await User.find({ email: { $in: DEMO_PHARMACY_ENTRIES.map((e) => e.adminEmail) } }).lean()).map((u) =>
        String(u.pharmacyId)
      )
    );
    console.log('');
    console.log(
      distinctPharmacyIds.size === DEMO_PHARMACY_ENTRIES.length
        ? 'OK: every demo admin is associated with a distinct pharmacy.'
        : 'WARNING: some demo admins share a pharmacyId - check the report above.'
    );
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error('Demo pharmacy admin seeding failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors during failure cleanup
  }
  process.exit(1);
});
