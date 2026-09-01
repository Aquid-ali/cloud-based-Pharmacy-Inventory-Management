// Shared by MedicineCatalog's pre-save hook, the enrichment pipeline, and the
// CSV migration script, so every caller normalizes the exact same way.

const DOSAGE_FORM_WORDS = new Set([
  'tablet', 'tablets', 'capsule', 'capsules', 'syrup', 'injection',
  'ointment', 'cream', 'drops', 'inhaler', 'lotion', 'suspension',
  'gel', 'powder', 'spray',
]);

// Safe, deterministic normalization only: case/whitespace/punctuation and
// "500 mg" -> "500mg" unit-spacing. Never changes a number or drops a unit,
// so this is safe to use as a database key for exact-ish matching (handles
// "Paracetamol 500mg" vs "PARACETAMOL 500 MG TABLET" -> both "paracetamol 500mg").
function normalizeMedicineName(rawName) {
  if (!rawName) return '';
  let s = String(rawName).toLowerCase().trim();
  s = s.replace(/(\d+(?:\.\d+)?)\s*(mgs?|milligrams?|mcg|micrograms?|g|grams?|ml)\b/g, '$1$2');
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const words = s.split(/\s+/).filter(Boolean).filter((w) => !DOSAGE_FORM_WORDS.has(w));
  return words.join(' ');
}

// A looser key that also strips a trailing unit ("500mg" -> "500"), so
// "paracetamol 500" and "paracetamol 500mg" collapse to the same key. This is
// intentionally NOT used to auto-merge two medicines - only to surface a
// possible match for an admin to confirm (needs_review), since a bare number
// without a unit is genuinely ambiguous.
function looseMatchKey(rawName) {
  return normalizeMedicineName(rawName).replace(/(\d+(?:\.\d+)?)(mg|mcg|g|ml)\b/g, '$1');
}

module.exports = { normalizeMedicineName, looseMatchKey };
