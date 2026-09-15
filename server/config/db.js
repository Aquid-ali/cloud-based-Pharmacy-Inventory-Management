const mongoose = require('mongoose');

let isConnected = false;
const ts = () => new Date().toISOString();

/**
 * Connects to MongoDB using Mongoose.
 *
 * In production, the server should not start if MongoDB
 * cannot be reached. This allows the hosting platform to
 * detect the failure and restart the service instead of
 * allowing database queries to buffer and eventually timeout.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        'MONGO_URI is not defined in environment variables.'
      );
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 20000,
    });

    isConnected = true;

    // Only log the resolved host - never the URI itself.
    console.log(
      `[${ts()}] MongoDB Connected: ${conn.connection.host}`
    );

    return conn;
  } catch (error) {
    isConnected = false;

    console.error(
      `[${ts()}] MongoDB Connection Failed: ${error.message}`
    );

    // IMPORTANT:
    // Do not swallow the error.
    // server.js will catch this and stop the application.
    throw error;
  }
};

/**
 * Keep connection state accurate during the lifetime
 * of the application.
 */
mongoose.connection.on('error', (error) => {
  isConnected = false;

  console.error(
    `[${ts()}] MongoDB connection error: ${error.message}`
  );
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;

  console.warn(
    `[${ts()}] MongoDB disconnected - database-backed features are temporarily unavailable.`
  );
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;

  console.log(`[${ts()}] MongoDB reconnected.`);
});

const getIsConnected = () => isConnected;

module.exports = {
  connectDB,
  getIsConnected,
};