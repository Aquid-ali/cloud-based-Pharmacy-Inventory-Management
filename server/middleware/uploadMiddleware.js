const multer = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Files are parsed in-memory and never written to disk - the import
// controller reads req.file.buffer directly.
const storage = multer.memoryStorage();

const csvFileFilter = (req, file, cb) => {
  const isCsv =
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.originalname.toLowerCase().endsWith('.csv');

  if (!isCsv) {
    return cb(new ApiError(400, 'Only CSV files are allowed'));
  }
  cb(null, true);
};

const uploadCsv = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: { fileSize: MAX_CSV_SIZE_BYTES },
});

module.exports = { uploadCsv, MAX_CSV_SIZE_BYTES };
