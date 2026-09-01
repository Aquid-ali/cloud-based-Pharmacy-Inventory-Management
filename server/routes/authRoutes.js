const express = require('express');
const router = express.Router();

const {
  registerUser,
  registerPharmacyAdmin,
  loginUser,
  logoutUser,
  getMe,
  updateMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  registerValidator,
  registerAdminValidator,
  loginValidator,
  updateMeValidator,
} = require('../validators/authValidator');

router.post('/register', registerValidator, validate, registerUser);
router.post('/register-admin', registerAdminValidator, validate, registerPharmacyAdmin);
router.post('/login', loginValidator, validate, loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMeValidator, validate, updateMe);

module.exports = router;
