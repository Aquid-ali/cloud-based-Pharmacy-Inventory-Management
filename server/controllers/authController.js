const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const generateToken = require('../utils/generateToken');
const hashToken = require('../utils/hashToken');
const ApiError = require('../utils/ApiError');
const { getIsConnected } = require('../config/db');
const { sendPasswordResetEmail } = require('../services/emailService');

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If an account exists with this email, a password reset link has been sent.';
const INVALID_OR_EXPIRED_TOKEN_MESSAGE = 'This password reset link is invalid or has expired.';

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

/**
 * @desc    Request a password reset link. Always responds with the same
 *          generic message regardless of whether the email is registered,
 *          so this endpoint can't be used to enumerate accounts. The
 *          in-memory (no-DB) fallback mode has nowhere to persist a reset
 *          token, so it short-circuits to the same generic response too.
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase();

  if (getIsConnected()) {
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = hashToken(rawToken);
      user.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      // Only the token fields changed - skip re-running full document
      // validation (and the password-hashing hook, which isModified guards
      // against anyway since password itself isn't touched here).
      await user.save({ validateBeforeSave: false });

      const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
      const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

      try {
        await sendPasswordResetEmail({ to: user.email, fullName: user.fullName, resetUrl });
      } catch (error) {
        // Never surface delivery/config failures to the client - that would
        // both leak account existence and expose infrastructure details.
        console.error(`[forgotPassword] Failed to send reset email: ${error.message}`);
      }
    }
  }

  res.status(200).json({ success: true, message: GENERIC_FORGOT_PASSWORD_MESSAGE });
});

/**
 * @desc    Complete a password reset using the raw token emailed to the user.
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!getIsConnected()) {
    throw new ApiError(503, 'Password reset requires a database connection');
  }

  if (!token) {
    throw new ApiError(400, INVALID_OR_EXPIRED_TOKEN_MESSAGE);
  }

  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpires: { $gt: new Date() },
  }).select('+resetTokenHash +resetTokenExpires');

  if (!user) {
    throw new ApiError(400, INVALID_OR_EXPIRED_TOKEN_MESSAGE);
  }

  user.password = password; // re-hashed by the model's pre('save') hook
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.',
  });
});

module.exports = {
  registerUser,
  registerPharmacyAdmin,
  loginUser,
  logoutUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
  inMemoryUsers,
};

