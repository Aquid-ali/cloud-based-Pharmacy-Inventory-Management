const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  registerUser,
  registerPharmacyAdmin,
  loginUser,
  logoutUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  registerValidator,
  registerAdminValidator,
  loginValidator,
  updateMeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidator');

// Tighter than the app-wide /api/auth limiter (100/15min) - forgot-password
// triggers an email send per request, so it's a more attractive target for
// abuse (inbox spam, cost) than a login attempt is.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Please try again later.' },
});

router.post('/register', registerValidator, validate, registerUser);
router.post('/register-admin', registerAdminValidator, validate, registerPharmacyAdmin);
router.post('/login', loginValidator, validate, loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMeValidator, validate, updateMe);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, validate, resetPassword);

module.exports = router;
