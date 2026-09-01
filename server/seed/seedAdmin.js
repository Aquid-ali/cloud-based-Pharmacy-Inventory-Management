require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Store = require('../models/Store');

/**
 * Every Admin account is scoped to exactly one Store. Public registration
 * only ever creates Customer accounts, so this script is the sole way to
 * provision Admins: it creates one Admin per Store (skipping stores that
 * already have one), using a password shared across all of them for
 * convenience during development/testing.
 */
const slugify = (name) => {
  const withoutPrefix = name.replace(/^MedStock Pharmacy\s*-\s*/i, '');
  return withoutPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const seedAdmin = async () => {
  await connectDB();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error('ADMIN_PASSWORD must be set in server/.env before running this script.');
    process.exit(1);
  }

  const stores = await Store.find().sort({ name: 1 });
  if (stores.length === 0) {
    console.error('No stores found. Run `npm run seed:stores` first.');
    process.exit(1);
  }

  const created = [];
  for (const store of stores) {
    const email = `admin.${slugify(store.name)}@medstock.com`;
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`Skipping ${email} (already exists).`);
      continue;
    }

    await User.create({
      fullName: `${store.name} Admin`,
      email,
      password,
      role: 'Admin',
      store: store._id,
    });
    created.push({ email, store: store.name });
  }

  if (created.length > 0) {
    console.log('\nCreated admin accounts (all share the ADMIN_PASSWORD from .env):');
    created.forEach(({ email, store }) => console.log(`  ${email}  ->  ${store}`));
  } else {
    console.log('No new admin accounts needed — every store already has one.');
  }

  await mongoose.disconnect();
  process.exit(0);
};

seedAdmin().catch((error) => {
  console.error('Failed to seed admin accounts:', error.message);
  process.exit(1);
});
