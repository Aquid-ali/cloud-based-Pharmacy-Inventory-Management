// Canonical order-status tint map, shared by Orders.jsx and OrderDetail.jsx
// (previously copy-pasted identically in both files).
export const statusTint = {
  Placed: 'bg-blue-50 text-blue-700 border-blue-200',
  Processing: 'bg-amber-50 text-amber-700 border-amber-200',
  'Out for Delivery': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

// The normal linear progression, matching server/models/Order.js's status
// enum minus the terminal branch state `Cancelled` (handled separately by
// OrderTimeline since the model doesn't record which step it was cancelled at).
export const ORDER_STEPS = ['Placed', 'Processing', 'Out for Delivery', 'Delivered'];
