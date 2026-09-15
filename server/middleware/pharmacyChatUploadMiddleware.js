const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { MAX_ATTACHMENTS } = require('../models/PharmacyMessage');

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per file
// Separate directory from the customer-chat feature's uploads/chat/ - keeps
// the two message systems' attachments and authorization checks from ever
// intermixing, even though the validation rules below are identical.
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'pharmacy-chat');

// Only these exact (extension, mimetype) pairs are accepted - both must
// match, so a renamed file can't slip through on either check alone.
const ALLOWED = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // Never derive the stored filename from user input (originalname) - a
  // random name sidesteps path traversal and filename-collision entirely.
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const expectedMime = ALLOWED[ext];
  if (!expectedMime || file.mimetype !== expectedMime) {
    return cb(new ApiError(400, 'Only JPG, PNG, and WEBP images are allowed'));
  }
  cb(null, true);
};

const uploadPharmacyChatImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: MAX_ATTACHMENTS },
}).array('images', MAX_ATTACHMENTS);

module.exports = { uploadPharmacyChatImages, MAX_IMAGE_SIZE_BYTES, UPLOAD_DIR };
