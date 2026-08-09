/**
 * Custom error class carrying an HTTP status code.
 * Thrown from controllers and caught by the centralized error handler.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
