const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connects to MongoDB using Mongoose.
 * Falls back gracefully if connection fails or times out (e.g. IP whitelist restrictions).
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`MongoDB Connection Warning: ${error.message}`);
    console.warn('Running server in fallback/in-memory mode for offline authentication and features.');
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };

