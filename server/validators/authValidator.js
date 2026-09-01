const { body } = require('express-validator');

const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const registerAdminValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('pharmacyName').trim().notEmpty().withMessage('Pharmacy name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').trim().notEmpty().withMessage('Pincode is required'),
  body('phone').optional().trim(),
  body('pharmacyEmail').optional().isEmail().withMessage('Please provide a valid pharmacy email'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateMeValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number is too long'),
  body('addresses').optional().isArray().withMessage('Addresses must be an array'),
  body('addresses.*.fullName').optional().trim().notEmpty().withMessage('Address full name is required'),
  body('addresses.*.phone').optional().trim().notEmpty().withMessage('Address phone is required'),
  body('addresses.*.line1').optional().trim().notEmpty().withMessage('Address line is required'),
  body('addresses.*.city').optional().trim().notEmpty().withMessage('City is required'),
  body('addresses.*.state').optional().trim().notEmpty().withMessage('State is required'),
  body('addresses.*.pincode').optional().trim().notEmpty().withMessage('Pincode is required'),
];

module.exports = { registerValidator, registerAdminValidator, loginValidator, updateMeValidator };
