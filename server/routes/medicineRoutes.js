const express = require('express');
const router = express.Router();

const {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getDashboardStats,
} = require('../controllers/medicineController');

const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createMedicineValidator,
  updateMedicineValidator,
  idParamValidator,
  listQueryValidator,
} = require('../validators/medicineValidator');

// All medicine routes require authentication
router.use(protect);

router.get('/stats/summary', getDashboardStats);

router
  .route('/')
  .get(listQueryValidator, validate, getMedicines)
  .post(
    authorize('Admin', 'Pharmacist'),
    createMedicineValidator,
    validate,
    createMedicine
  );

router
  .route('/:id')
  .get(idParamValidator, validate, getMedicineById)
  .put(
    authorize('Admin', 'Pharmacist'),
    updateMedicineValidator,
    validate,
    updateMedicine
  )
  .delete(authorize('Admin'), idParamValidator, validate, deleteMedicine);

module.exports = router;
