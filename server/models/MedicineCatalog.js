const mongoose = require('mongoose');
const crypto = require('crypto');
const { normalizeMedicineName } = require('../utils/normalizeMedicineName');

// Human-readable unique id, e.g. MED-LX3F9A2B1C - independent of the Mongo _id
const generateMedicineId = () =>
  `MED-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// Percentage of reviews falling into each bucket - sourced from the medicine
// dataset's "Excellent/Average/Poor Review %" columns.
const reviewStatsSchema = new mongoose.Schema(
  {
    excellent: { type: Number, min: 0, max: 100, default: 0 },
    average: { type: Number, min: 0, max: 100, default: 0 },
    poor: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const medicineCatalogSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      unique: true,
      default: generateMedicineId,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      index: true,
    },
    // Lowercased/whitespace-normalized form of `name`, kept in sync via the
    // pre-save hook below. Used by the enrichment pipeline and the CSV
    // migration to recognize "Paracetamol 500mg" / "PARACETAMOL 500 MG
    // TABLET" as candidates for the same medicine without ever silently
    // merging genuinely different products - see utils/normalizeMedicineName.
    normalizedName: {
      type: String,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    // Not marked `required` (unlike name/manufacturer) because medicines migrated
    // from a pharmacy's own CSV/store data often don't have verified composition
    // data available until enrichment fills it in - see enrichmentStatus below.
    // Still required when an Admin manually adds a new catalog entry via
    // createMedicineValidator.
    composition: {
      type: String,
      trim: true,
    },
    strength: {
      type: String,
      trim: true,
    },
    dosageForm: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    uses: {
      type: String,
      trim: true,
    },
    howItWorks: {
      type: String,
      trim: true,
    },
    sideEffects: {
      type: String,
      trim: true,
    },
    precautions: {
      type: String,
      trim: true,
    },
    contraindications: {
      type: String,
      trim: true,
    },
    storage: {
      type: String,
      trim: true,
    },
    // null = not established (distinct from false = confirmed over-the-counter)
    prescriptionRequired: {
      type: Boolean,
      default: null,
    },
    // --- Batch tracking --------------------------------------------------------
    // Set whenever a NEW Inventory batch is created for this medicine (see
    // inventoryController.createInventoryItem) - never touched by editing an
    // existing batch's quantity/price, or by stock being decremented from a
    // sale/order, so it only ever reflects a genuine new-stock event. Powers the
    // customer-facing "New Batch Added" indicator: a medicine has a new batch
    // to announce exactly when this doesn't match what a given customer has
    // already been shown (tracked per-user in MedicineBatchView).
    latestBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      default: null,
    },
    latestBatchAddedAt: {
      type: Date,
      default: null,
    },
    // --- Enrichment tracking -------------------------------------------------
    // Where this record's clinical fields (composition/uses/howItWorks/
    // sideEffects/precautions/contraindications) stand in the enrichment
    // pipeline. 'completed' is only ever set once real data was found and
    // validated (matched against the imported reference dataset, or a
    // confidently-identified AI enrichment) - never inferred or guessed.
    enrichmentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'needs_review'],
      default: 'pending',
      index: true,
    },
    // 0-100. How confident the identification/enrichment step was that this
    // record's clinical fields genuinely describe this medicine.
    enrichmentConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Where the current clinical fields came from, e.g. 'reference-dataset'
    // (the ~11,500-row imported CSV), 'ai:claude-opus-5', or 'admin-manual'.
    informationSource: {
      type: String,
      trim: true,
      default: '',
    },
    lastEnrichedAt: {
      type: Date,
      default: null,
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
    // Human-readable reason the last enrichment attempt failed or was flagged
    // for review, e.g. "Unable to confidently identify medicine".
    enrichmentError: {
      type: String,
      trim: true,
      default: '',
    },
    // The AI's best-effort structured guess when enrichmentStatus is
    // 'needs_review' - shown on the admin review screen so an admin can judge
    // it before it's ever applied to the live fields above. Never read by any
    // customer-facing code; cleared once the record moves to 'completed'.
    enrichmentProposal: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
      index: true,
    },
    reviewStats: {
      type: reviewStatsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// This is the master, pharmacy-independent medicine database - it must never
// carry stock/price/batch/expiry data, which belongs on Inventory instead.
// A given product name from a given manufacturer should only exist once here;
// the future CSV importer will dedupe against this index.
medicineCatalogSchema.index({ name: 1, manufacturer: 1 }, { unique: true });

// Text index to support fast search on name/composition/manufacturer
medicineCatalogSchema.index({ name: 'text', composition: 'text', manufacturer: 'text' });

medicineCatalogSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.normalizedName = normalizeMedicineName(this.name);
  }
  next();
});

medicineCatalogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('MedicineCatalog', medicineCatalogSchema);
