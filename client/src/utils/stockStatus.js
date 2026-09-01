// Canonical stock-status tint maps, built on the `stock.*` design tokens
// (tailwind.config.js). Replaces four independent, mutually-inconsistent
// copies previously duplicated across PharmacyMedicineCard.jsx,
// shop/MedicineDetail.jsx, and customer/MedicineDetails.jsx.
// (Badge.jsx's own status map is left untouched — it's shared by ~10+
// out-of-scope admin pages with a different, broader set of keys.)

// Pill badge treatment (background + text + border).
export const stockTint = {
  'In Stock': 'bg-stock-in/10 text-stock-in border-stock-in/30',
  'Low Stock': 'bg-stock-low/10 text-stock-low border-stock-low/30',
  'Out of Stock': 'bg-stock-out/10 text-stock-out border-stock-out/30',
  Expired: 'bg-rose-50 text-rose-700 border-rose-200',
};

// Text-only treatment, for cards that show status as a label rather than a pill.
export const stockTextTint = {
  'In Stock': 'text-stock-in',
  'Low Stock': 'text-stock-low',
  'Out of Stock': 'text-stock-out',
  Expired: 'text-rose-600',
};
