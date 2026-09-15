const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ['Admin', 'Customer'],
      default: 'Customer',
    },
    // Legacy per-store admin association (drives the existing /shop cart+order flow).
    // An Admin is scoped to exactly one of `store` or `pharmacyId`, never both -
    // required only when the newer pharmacy-based association isn't set.
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: function () {
        return this.role === 'Admin' && !this.pharmacyId;
      },
    },
    // Pharmacy-based admin association (drives Inventory/MedicineCatalog isolation).
    // Optional and independent of `store` - see comment above.
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
    },
    phone: {
      type: String,
      trim: true,
    },
    addresses: [
      {
        fullName: { type: String, trim: true },
        phone: { type: String, trim: true },
        line1: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    // Forgot-password flow (authController.forgotPassword/resetPassword). Only
    // ever holds the SHA-256 hash of the reset token, never the raw value -
    // select: false keeps both out of every default query result, same as
    // password. A fresh forgot-password request overwrites these, which
    // naturally invalidates any earlier unused reset link for this user.
    resetTokenHash: {
      type: String,
      select: false,
      index: true,
    },
    resetTokenExpires: {
      type: Date,
      select: false,
    },
    // Set whenever a password is changed after account creation (see the
    // pre('save') hook below). authMiddleware.protect compares this against
    // a JWT's `iat` so tokens issued before a password reset stop working,
    // without needing a server-side session/blacklist store.
    passwordChangedAt: {
      type: Date,
    },
  },
  { timestamps: true } // adds createdAt & updatedAt
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Only mark existing accounts - not a still-being-created document - so a
  // fresh registration's own login isn't immediately invalidated by this.
  // The 1s rewind guards against the JWT's `iat` (second precision) landing
  // in the same second as this write.
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

// Instance method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Never leak password/version key in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
