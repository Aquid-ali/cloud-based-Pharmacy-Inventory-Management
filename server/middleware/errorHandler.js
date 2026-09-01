const ApiError = require('../utils/ApiError');

/**
 * 404 handler - catches requests to routes that don't exist.
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Centralized error handler.
 * Any thrown ApiError, Mongoose error, or unexpected error lands here.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id: ${err.value}`;
  }

  // Multer upload errors (file too large, unexpected field, etc.)
  if (err.name === 'MulterError') {
    statusCode = 400;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Server-side diagnostic log - never sent to the client. Only a safe scope
  // identifier (pharmacyId/storeId) is included, never a token, password, or
  // full user document, so this is safe to leave on in every environment.
  const scopeId = req.user?.pharmacyId?._id || req.user?.pharmacyId || req.user?.store?._id || req.user?.store;
  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${statusCode} ${err.name || 'Error'}: ${message}` +
      (scopeId ? ` (scope: ${scopeId})` : '')
  );
  if (statusCode >= 500 && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
