require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;
const ts = () => new Date().toISOString();

// Full diagnostic detail on stderr (name/message/stack) - never swallowed,
// never just a one-line summary, so a crash is actually diagnosable from the
// terminal instead of requiring a debugger to reproduce.
const logFatal = (label, error) => {
  console.error('');
  console.error(`[${ts()}] ${label}`);
  console.error(`  Name: ${error?.name || 'Unknown'}`);
  console.error(`  Message: ${error?.message ?? error}`);
  if (error?.stack) console.error(error.stack);
  console.error('');
};

let server;

// Connect to database, then start listening
connectDB().then(() => {
  server = app.listen(PORT, () => {
    console.log(`[${ts()}] MediChain server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a different value.`);
    } else {
      logFatal('Server startup error', error);
    }
    process.exit(1);
  });
});

// Closes the HTTP server and the Mongoose connection before exiting, rather
// than an abrupt process.exit(), so in-flight requests get a chance to finish
// and the DB connection isn't left dangling. Force-exits after 5s in case
// close() itself hangs (e.g. a stuck keep-alive socket).
const shutdown = (exitCode) => {
  if (server) {
    server.close(() => {
      mongoose.connection.close(false).finally(() => process.exit(exitCode));
    });
    setTimeout(() => process.exit(exitCode), 5000).unref();
  } else {
    process.exit(exitCode);
  }
};

// Last-resort safety nets. With every route wrapped in express-async-handler
// and the MongoDB connection's own error/disconnected events now handled (see
// config/db.js - previously the actual cause of most crashes, since an
// unhandled EventEmitter 'error' on the Mongoose connection kills the process
// outright), these should rarely fire in normal operation. When one does,
// it's logged in full (never silently ignored) before the process exits -
// Node's own guidance for both event types, since continuing after either
// leaves the process in a genuinely unknown state.
process.on('unhandledRejection', (err) => {
  logFatal('UNHANDLED PROMISE REJECTION', err);
  shutdown(1);
});

process.on('uncaughtException', (err) => {
  logFatal('UNCAUGHT EXCEPTION', err);
  shutdown(1);
});
