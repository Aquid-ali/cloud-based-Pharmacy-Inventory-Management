require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;
const ts = () => new Date().toISOString();

// Full diagnostic detail on fatal errors
const logFatal = (label, error) => {
  console.error('');
  console.error(`[${ts()}] ${label}`);
  console.error(`  Name: ${error?.name || 'Unknown'}`);
  console.error(`  Message: ${error?.message ?? error}`);

  if (error?.stack) {
    console.error(error.stack);
  }

  console.error('');
};

let server;

// Connect to database, then start listening
connectDB()
  .then(() => {
    server = app.listen(PORT,'0.0.0.0', () => {
      console.log(
        `[${ts()}] MediChain server running in ${
          process.env.NODE_ENV || 'development'
        } mode on port ${PORT}`
      );
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `[${ts()}] Port ${PORT} is already in use.`
        );
      } else {
        logFatal('Server startup error', error);
      }

      process.exit(1);
    });
  })
  .catch((error) => {
    logFatal('DATABASE CONNECTION FAILED', error);
    process.exit(1);
  });

// Gracefully shut down the HTTP server and MongoDB connection
const shutdown = (exitCode) => {
  if (server) {
    server.close(() => {
      mongoose.connection
        .close(false)
        .finally(() => process.exit(exitCode));
    });

    // Force exit after 5 seconds if shutdown hangs
    setTimeout(() => {
      process.exit(exitCode);
    }, 5000).unref();
  } else {
    mongoose.connection
      .close(false)
      .finally(() => process.exit(exitCode));
  }
};

// Graceful shutdown signals used by hosting platforms
process.on('SIGTERM', () => {
  console.log(`[${ts()}] SIGTERM received. Shutting down...`);
  shutdown(0);
});

process.on('SIGINT', () => {
  console.log(`[${ts()}] SIGINT received. Shutting down...`);
  shutdown(0);
});

// Last-resort safety nets
process.on('unhandledRejection', (err) => {
  logFatal('UNHANDLED PROMISE REJECTION', err);
  shutdown(1);
});

process.on('uncaughtException', (err) => {
  logFatal('UNCAUGHT EXCEPTION', err);
  shutdown(1);
});

