const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const { getIsConnected } = require('../config/db');

// In-memory fallback user store when MongoDB is not connected
const inMemoryUsers = new Map();

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const normalizedEmail = email ? email.toLowerCase() : '';

  if (!normalizedEmail || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  if (getIsConnected()) {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(409, 'A user with this email already exists');
    }

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      password,
      role: role || 'Pharmacist',
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, token },
    });
  } else {
    if (inMemoryUsers.has(normalizedEmail)) {
      throw new ApiError(409, 'A user with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      _id: 'user_' + Date.now(),
      fullName: fullName || 'Pharmacy User',
      email: normalizedEmail,
      role: role || 'Pharmacist',
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    inMemoryUsers.set(normalizedEmail, user);
    inMemoryUsers.set(user._id, user);

    const token = generateToken(user._id);
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: userWithoutPassword, token },
    });
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email ? email.toLowerCase() : '';

  if (!normalizedEmail || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  if (getIsConnected()) {
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } else {
    const user = inMemoryUsers.get(normalizedEmail);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user._id);
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token },
    });
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

module.exports = { registerUser, loginUser, logoutUser, getMe, inMemoryUsers };

