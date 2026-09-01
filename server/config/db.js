const mongoose = require('mongoose');

let isConnected = false;
const ts = () => new Date().toISOString();

/**
 * Connects to MongoDB using Mongoose.
 * Falls back gracefully if connection fails or times out (e.g. IP whitelist restrictions) -
 * see getIsConnected()'s call sites (authController, medicineController, etc.), which
 * degrade to in-memory/zeroed behavior instead of throwing when this is false.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 20000,
    });
    isConnected = true;
    // Only the resolved host is logged - never the URI itself (which carries credentials).
    console.log(`[${ts()}] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[${ts()}] MongoDB Connection Warning: ${error.message}`);
    console.warn('Running server in fallback/in-memory mode for offline authentication and features.');
  }
};

// Keeps `isConnected` accurate for the whole lifetime of the process, not just
// the initial connect attempt above - a healthy connection can still drop
// later (Atlas maintenance, network blip), and every getIsConnected() call
// site depends on this flag being current to degrade gracefully instead of
// issuing queries against a dead socket.
//
// These listeners are also required for basic process stability in their own
// right: `mongoose.connection` is a Node EventEmitter, and by default an
// 'error' event emitted with no listener attached crashes the entire Node
// process immediately. Without this handler, any transient Atlas network
// error after the initial connect (not just at startup) could kill the server.
mongoose.connection.on('error', (error) => {
  isConnected = false;
  console.error(`[${ts()}] MongoDB connection error: ${error.message}`);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn(`[${ts()}] MongoDB disconnected - database-backed features will be degraded until it reconnects.`);
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log(`[${ts()}] MongoDB reconnected.`);
});

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };

