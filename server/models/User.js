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
  },
  { timestamps: true } // adds createdAt & updatedAt
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
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
