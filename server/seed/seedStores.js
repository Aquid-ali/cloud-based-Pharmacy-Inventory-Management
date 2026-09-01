require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Store = require('../models/Store');

const sampleStores = [
  {
    name: 'MedStock Pharmacy - Connaught Place',
    address: { line1: 'Block A, Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    phone: '+91 11 4000 1001',
    openingHours: '8:00 AM - 10:00 PM',
    location: { lat: 28.6315, lng: 77.2167 },
  },
  {
    name: 'MedStock Pharmacy - Karol Bagh',
    address: { line1: 'Ajmal Khan Road', city: 'New Delhi', state: 'Delhi', pincode: '110005' },
    phone: '+91 11 4000 1002',
    openingHours: '9:00 AM - 9:00 PM',
    location: { lat: 28.6519, lng: 77.1909 },
  },
  {
    name: 'MedStock Pharmacy - Saket',
    address: { line1: 'District Centre, Saket', city: 'New Delhi', state: 'Delhi', pincode: '110017' },
    phone: '+91 11 4000 1003',
    openingHours: '9:00 AM - 11:00 PM',
    location: { lat: 28.5245, lng: 77.2066 },
  },
  {
    name: 'MedStock Pharmacy - Dwarka',
    address: { line1: 'Sector 12, Dwarka', city: 'New Delhi', state: 'Delhi', pincode: '110078' },
    phone: '+91 11 4000 1004',
    openingHours: '8:00 AM - 10:00 PM',
    location: { lat: 28.5921, lng: 77.0460 },
  },
  {
    name: 'MedStock Pharmacy - Andheri West',
    address: { line1: 'Link Road, Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400058' },
    phone: '+91 22 4000 2001',
    openingHours: '24 hours',
    location: { lat: 19.1364, lng: 72.8296 },
  },
  {
    name: 'MedStock Pharmacy - Bandra',
    address: { line1: 'Hill Road, Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
    phone: '+91 22 4000 2002',
    openingHours: '8:00 AM - 11:00 PM',
    location: { lat: 19.0596, lng: 72.8295 },
  },
  {
    name: 'MedStock Pharmacy - Koramangala',
    address: { line1: '80 Feet Road, Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
    phone: '+91 80 4000 3001',
    openingHours: '9:00 AM - 10:00 PM',
    location: { lat: 12.9352, lng: 77.6245 },
  },
  {
    name: 'MedStock Pharmacy - Indiranagar',
    address: { line1: '100 Feet Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
    phone: '+91 80 4000 3002',
    openingHours: '24 hours',
    location: { lat: 12.9719, lng: 77.6412 },
  },
];

const seedStores = async () => {
  await connectDB();

  const count = await Store.countDocuments();
  if (count > 0) {
    console.log(`Stores collection already has ${count} document(s). Skipping seed (drop the collection first to reseed).`);
  } else {
    await Store.insertMany(sampleStores);
    console.log(`Seeded ${sampleStores.length} stores.`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

seedStores().catch((error) => {
  console.error('Failed to seed stores:', error.message);
  process.exit(1);
});
