const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { getIsConnected } = require('../config/db');
const { inMemoryUsers } = require('../controllers/authController');

/**
 * Protect routes - verifies JWT from the Authorization header
 * and attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;

    if (getIsConnected()) {
      user = await User.findById(decoded.id);
    } else {
      user = inMemoryUsers.get(decoded.id);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      }
    }

    if (!user) {
      throw new ApiError(401, 'Not authorized, user no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Not authorized, token failed or expired');
  }
});

/**
 * Role-based authorization middleware.
 * Usage: authorize('Admin') or authorize('Admin', 'Pharmacist')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this resource`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
