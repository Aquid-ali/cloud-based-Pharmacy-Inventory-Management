const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
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
  const { fullName, email, password } = req.body;
  const normalizedEmail = email ? email.toLowerCase() : '';

  if (!normalizedEmail || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Public registration always creates a Customer account.
  // Admin accounts are provisioned separately via `npm run seed:admin`.
  if (getIsConnected()) {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(409, 'A user with this email already exists');
    }

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      password,
      role: 'Customer',
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
      fullName: fullName || 'Customer',
      email: normalizedEmail,
      role: 'Customer',
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
 * @desc    Self-service registration for a new Pharmacy Admin. Creates a brand
 *          new Pharmacy AND the Admin User that owns it in one call, correctly
 *          cross-linked (Pharmacy.ownerId <-> User.pharmacyId) - the same
 *          relationship the demo seed scripts set up, but for a real signup.
 *          Uses the existing User model / bcrypt hashing - no new auth system.
 * @route   POST /api/auth/register-admin
 * @access  Public
 */
const registerPharmacyAdmin = asyncHandler(async (req, res) => {
  if (!getIsConnected()) {
    throw new ApiError(503, 'Admin registration requires a database connection');
  }

  const { fullName, email, password, pharmacyName, address, city, state, pincode, phone, pharmacyEmail } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  // The Pharmacy needs an ownerId (User) and the User needs a pharmacyId (Pharmacy) -
  // each requires the other's _id to exist. Pre-generating the User's _id lets us
  // create the Pharmacy first (satisfying its required ownerId) and then create the
  // User with that same _id, so both documents are correctly linked from the start
  // with no placeholder/orphaned intermediate state.
  const newUserId = new mongoose.Types.ObjectId();
  let pharmacy;
  try {
    pharmacy = await Pharmacy.create({
      name: pharmacyName,
      address,
      city,
      state,
      pincode,
      phone,
      email: pharmacyEmail || undefined,
      ownerId: newUserId,
      status: 'active',
    });

    const user = await User.create({
      _id: newUserId,
      fullName,
      email: normalizedEmail,
      password,
      role: 'Admin',
      pharmacyId: pharmacy._id,
    });

    const token = generateToken(user._id);
    const populatedUser = await User.findById(user._id).populate('pharmacyId');

    res.status(201).json({
      success: true,
      message: 'Admin account and pharmacy created successfully',
      data: { user: populatedUser, token },
    });
  } catch (error) {
    // Roll back the pharmacy if the paired user creation failed (e.g. a
    // duplicate-email race), so a failed signup never leaves an orphaned
    // ownerless-in-practice pharmacy behind.
    if (pharmacy) {
      await Pharmacy.deleteOne({ _id: pharmacy._id });
    }
    throw error;
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
    const user = await User.findOne({ email: normalizedEmail })
      .select('+password')
      .populate('store')
      .populate('pharmacyId');

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

/**
 * @desc    Update the currently authenticated user's profile
 * @route   PATCH /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const { fullName, phone, addresses } = req.body;

  if (!getIsConnected()) {
    throw new ApiError(503, 'Profile updates require a database connection');
  }

  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (phone !== undefined) updates.phone = phone;
  if (addresses !== undefined) updates.addresses = addresses;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

module.exports = { registerUser, registerPharmacyAdmin, loginUser, logoutUser, getMe, updateMe, inMemoryUsers };

