const mongoose = require('mongoose');

// Records the latest batch a given customer has already been shown the
// "New Batch Added" indicator for, on a given medicine. One row per
// (userId, medicineId) pair - it only ever needs to remember the most recent
// batch seen, not a full history, so it's updated in place rather than
// accumulating rows. Survives refresh/logout/navigation by design (this is
// the persistence layer requested instead of relying on frontend state).
const medicineBatchViewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineCatalog',
      required: true,
    },
    lastSeenBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
  },
  { timestamps: true }
);

medicineBatchViewSchema.index({ userId: 1, medicineId: 1 }, { unique: true });

module.exports = mongoose.model('MedicineBatchView', medicineBatchViewSchema);
