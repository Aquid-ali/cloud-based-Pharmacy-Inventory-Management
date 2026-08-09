export { default as Badge } from '../components/Badge';

export const stockData = [
  { id: 1, medicine: 'Paracetamol 500mg', sku: 'MED-001', current: 450, min: 100, max: 1000, status: 'In Stock' },
  { id: 2, medicine: 'Amoxicillin 250mg', sku: 'MED-002', current: 45, min: 50, max: 500, status: 'Low Stock' },
  { id: 3, medicine: 'Ibuprofen 400mg', sku: 'MED-003', current: 0, min: 75, max: 600, status: 'Out of Stock' },
  { id: 4, medicine: 'Metformin 500mg', sku: 'MED-004', current: 320, min: 80, max: 800, status: 'In Stock' },
  { id: 5, medicine: 'Omeprazole 20mg', sku: 'MED-005', current: 28, min: 40, max: 400, status: 'Low Stock' },
];

export const categoriesData = [
  { id: 1, name: 'Antibiotics', medicines: 24, status: 'Active' },
  { id: 2, name: 'Pain Relief', medicines: 18, status: 'Active' },
  { id: 3, name: 'Vitamins & Supplements', medicines: 32, status: 'Active' },
  { id: 4, name: 'Cardiovascular', medicines: 15, status: 'Active' },
  { id: 5, name: 'Diabetes Care', medicines: 12, status: 'Active' },
  { id: 6, name: 'Dermatology', medicines: 9, status: 'Inactive' },
];

export const batchesData = [
  { id: 1, batch: 'BT-2024-001', medicine: 'Paracetamol 500mg', qty: 500, mfg: '2024-01-15', expiry: '2026-01-15', status: 'In Stock' },
  { id: 2, batch: 'BT-2024-002', medicine: 'Amoxicillin 250mg', qty: 200, mfg: '2024-03-01', expiry: '2025-09-01', status: 'Low Stock' },
  { id: 3, batch: 'BT-2023-045', medicine: 'Ibuprofen 400mg', qty: 0, mfg: '2023-06-10', expiry: '2025-06-10', status: 'Out of Stock' },
  { id: 4, batch: 'BT-2024-003', medicine: 'Metformin 500mg', qty: 350, mfg: '2024-02-20', expiry: '2026-02-20', status: 'In Stock' },
  { id: 5, batch: 'BT-2023-099', medicine: 'Omeprazole 20mg', qty: 15, mfg: '2023-01-05', expiry: '2025-08-05', status: 'Expired' },
];

export const manufacturersData = [
  { id: 1, name: 'PharmaCorp Ltd', country: 'India', products: 45, contact: '+91 98765 43210', status: 'Active' },
  { id: 2, name: 'MediLife Inc', country: 'USA', products: 28, contact: '+1 555-0123', status: 'Active' },
  { id: 3, name: 'HealthGen Pharma', country: 'Germany', products: 19, contact: '+49 30 1234567', status: 'Active' },
  { id: 4, name: 'BioMed Solutions', country: 'UK', products: 12, contact: '+44 20 7946 0958', status: 'Inactive' },
];

export const suppliersData = [
  { id: 1, name: 'Global Med Supply', contact: 'Rajesh Kumar', phone: '+91 99887 76655', email: 'rajesh@gms.com', orders: 34, status: 'Active' },
  { id: 2, name: 'City Pharma Distributors', contact: 'Priya Sharma', phone: '+91 88776 65544', email: 'priya@cpd.com', orders: 22, status: 'Active' },
  { id: 3, name: 'QuickMed Logistics', contact: 'Amit Patel', phone: '+91 77665 54433', email: 'amit@qml.com', orders: 18, status: 'Active' },
  { id: 4, name: 'Regional Health Supply', contact: 'Sneha Reddy', phone: '+91 66554 43322', email: 'sneha@rhs.com', orders: 8, status: 'Inactive' },
];

export const salesHistoryData = [
  { id: 'INV-1042', date: '2026-08-05', customer: 'Walk-in Customer', items: 3, total: '₹1,245', payment: 'Cash', status: 'Completed' },
  { id: 'INV-1041', date: '2026-08-05', customer: 'Rahul Mehta', items: 5, total: '₹3,890', payment: 'UPI', status: 'Completed' },
  { id: 'INV-1040', date: '2026-08-04', customer: 'Anita Desai', items: 2, total: '₹560', payment: 'Card', status: 'Completed' },
  { id: 'INV-1039', date: '2026-08-04', customer: 'Walk-in Customer', items: 1, total: '₹180', payment: 'Cash', status: 'Completed' },
  { id: 'INV-1038', date: '2026-08-03', customer: 'Vikram Singh', items: 7, total: '₹5,420', payment: 'UPI', status: 'Completed' },
];

export const returnsData = [
  { id: 'RET-001', date: '2026-08-04', invoice: 'INV-1035', customer: 'Anita Desai', reason: 'Wrong medicine', amount: '₹320', status: 'Approved' },
  { id: 'RET-002', date: '2026-08-03', invoice: 'INV-1028', customer: 'Rahul Mehta', reason: 'Expired product', amount: '₹150', status: 'Pending' },
  { id: 'RET-003', date: '2026-08-01', invoice: 'INV-1015', customer: 'Walk-in Customer', reason: 'Damaged packaging', amount: '₹85', status: 'Completed' },
];

export const quotationsData = [
  { id: 'QUO-012', date: '2026-08-05', customer: 'City Hospital', items: 12, total: '₹45,600', validUntil: '2026-08-20', status: 'Pending' },
  { id: 'QUO-011', date: '2026-08-03', customer: 'Dr. Sharma Clinic', items: 5, total: '₹8,200', validUntil: '2026-08-18', status: 'Approved' },
  { id: 'QUO-010', date: '2026-07-28', customer: 'Green Valley Nursing Home', items: 20, total: '₹92,400', validUntil: '2026-08-12', status: 'Draft' },
];

export const purchaseOrdersData = [
  { id: 'PO-089', date: '2026-08-04', supplier: 'Global Med Supply', items: 15, total: '₹28,500', expected: '2026-08-08', status: 'Pending' },
  { id: 'PO-088', date: '2026-08-02', supplier: 'City Pharma Distributors', items: 8, total: '₹12,400', expected: '2026-08-06', status: 'Approved' },
  { id: 'PO-087', date: '2026-07-30', supplier: 'QuickMed Logistics', items: 22, total: '₹41,200', expected: '2026-08-03', status: 'Completed' },
];

export const purchaseHistoryData = [
  { id: 'PO-087', date: '2026-07-30', supplier: 'QuickMed Logistics', items: 22, total: '₹41,200', received: '2026-08-02', status: 'Completed' },
  { id: 'PO-086', date: '2026-07-25', supplier: 'Global Med Supply', items: 10, total: '₹18,900', received: '2026-07-28', status: 'Completed' },
  { id: 'PO-085', date: '2026-07-20', supplier: 'City Pharma Distributors', items: 6, total: '₹9,600', received: '2026-07-23', status: 'Completed' },
];

export const customersData = [
  { id: 1, name: 'Rahul Mehta', phone: '+91 98765 11111', email: 'rahul.m@email.com', orders: 24, loyalty: 'Gold', status: 'Active' },
  { id: 2, name: 'Anita Desai', phone: '+91 98765 22222', email: 'anita.d@email.com', orders: 18, loyalty: 'Silver', status: 'Active' },
  { id: 3, name: 'Vikram Singh', phone: '+91 98765 33333', email: 'vikram.s@email.com', orders: 31, loyalty: 'Platinum', status: 'Active' },
  { id: 4, name: 'Priya Nair', phone: '+91 98765 44444', email: 'priya.n@email.com', orders: 7, loyalty: 'Bronze', status: 'Active' },
  { id: 5, name: 'Amit Patel', phone: '+91 98765 55555', email: 'amit.p@email.com', orders: 3, loyalty: 'Bronze', status: 'Inactive' },
];

export const prescriptionsData = [
  { id: 'RX-2041', date: '2026-08-05', patient: 'Rahul Mehta', doctor: 'Dr. Sharma', medicines: 3, status: 'Completed' },
  { id: 'RX-2040', date: '2026-08-05', patient: 'Anita Desai', doctor: 'Dr. Patel', medicines: 2, status: 'Pending' },
  { id: 'RX-2039', date: '2026-08-04', patient: 'Vikram Singh', doctor: 'Dr. Kumar', medicines: 5, status: 'Completed' },
  { id: 'RX-2038', date: '2026-08-04', patient: 'Priya Nair', doctor: 'Dr. Sharma', medicines: 1, status: 'Completed' },
];

export const staffData = [
  { id: 1, name: 'Admin User', role: 'Admin', email: 'admin@medstock.com', phone: '+91 90000 00001', joinDate: '2024-01-15', status: 'Active' },
  { id: 2, name: 'Dr. Priya Sharma', role: 'Pharmacist', email: 'priya@medstock.com', phone: '+91 90000 00002', joinDate: '2024-03-01', status: 'Active' },
  { id: 3, name: 'Raj Kumar', role: 'Pharmacist', email: 'raj@medstock.com', phone: '+91 90000 00003', joinDate: '2024-06-10', status: 'Active' },
  { id: 4, name: 'Sneha Reddy', role: 'Cashier', email: 'sneha@medstock.com', phone: '+91 90000 00004', joinDate: '2025-01-20', status: 'Active' },
];

export const rolesData = [
  { id: 1, role: 'Admin', users: 1, permissions: 'Full Access', description: 'Complete system control' },
  { id: 2, role: 'Pharmacist', users: 2, permissions: 'Inventory, Sales, Prescriptions', description: 'Medicine and sales management' },
  { id: 3, role: 'Cashier', users: 1, permissions: 'POS, Customers', description: 'Billing and customer service' },
  { id: 4, role: 'Manager', users: 0, permissions: 'Reports, Analytics', description: 'Business insights and reports' },
];

export const attendanceData = [
  { id: 1, name: 'Admin User', date: '2026-08-05', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h', status: 'Present' },
  { id: 2, name: 'Dr. Priya Sharma', date: '2026-08-05', checkIn: '09:15 AM', checkOut: '05:45 PM', hours: '8.5h', status: 'Late' },
  { id: 3, name: 'Raj Kumar', date: '2026-08-05', checkIn: '08:55 AM', checkOut: '06:10 PM', hours: '9.25h', status: 'Present' },
  { id: 4, name: 'Sneha Reddy', date: '2026-08-05', checkIn: '-', checkOut: '-', hours: '-', status: 'Absent' },
];

export const lowStockAlerts = [
  { id: 1, medicine: 'Amoxicillin 250mg', current: 45, min: 50, severity: 'Warning' },
  { id: 2, medicine: 'Omeprazole 20mg', current: 28, min: 40, severity: 'Warning' },
  { id: 3, medicine: 'Ibuprofen 400mg', current: 0, min: 75, severity: 'Critical' },
  { id: 4, medicine: 'Aspirin 75mg', current: 12, min: 30, severity: 'Critical' },
];

export const expiryAlerts = [
  { id: 1, medicine: 'Omeprazole 20mg', batch: 'BT-2023-099', expiry: '2025-08-05', qty: 15, severity: 'Critical' },
  { id: 2, medicine: 'Cetirizine 10mg', batch: 'BT-2024-018', expiry: '2025-09-15', qty: 80, severity: 'Warning' },
  { id: 3, medicine: 'Amoxicillin 250mg', batch: 'BT-2024-002', expiry: '2025-09-01', qty: 45, severity: 'Warning' },
];

export const orderNotifications = [
  { id: 1, title: 'Purchase Order PO-089 received', time: '2 hours ago', type: 'Purchase', status: 'Pending' },
  { id: 2, title: 'New quotation request from City Hospital', time: '4 hours ago', type: 'Sales', status: 'Pending' },
  { id: 3, title: 'Stock received for PO-087', time: '1 day ago', type: 'Purchase', status: 'Completed' },
  { id: 4, title: 'Return request RET-002 pending approval', time: '2 days ago', type: 'Sales', status: 'Pending' },
];

export const messagesData = [
  { id: 1, from: 'Global Med Supply', subject: 'Price update for Q3 2026', date: '2026-08-05', read: false },
  { id: 2, from: 'City Hospital', subject: 'Bulk order inquiry', date: '2026-08-04', read: false },
  { id: 3, from: 'System', subject: 'Weekly backup completed successfully', date: '2026-08-03', read: true },
  { id: 4, from: 'Dr. Sharma Clinic', subject: 'Prescription refill request', date: '2026-08-02', read: true },
];

export const auditLogsData = [
  { id: 1, user: 'Admin User', action: 'Created medicine Paracetamol 500mg', module: 'Inventory', timestamp: '2026-08-05 14:32:10', ip: '192.168.1.10' },
  { id: 2, user: 'Dr. Priya Sharma', action: 'Processed sale INV-1042', module: 'Sales', timestamp: '2026-08-05 13:15:44', ip: '192.168.1.12' },
  { id: 3, user: 'Admin User', action: 'Updated pharmacy profile', module: 'Settings', timestamp: '2026-08-05 11:00:22', ip: '192.168.1.10' },
  { id: 4, user: 'Raj Kumar', action: 'Received stock for PO-087', module: 'Purchase', timestamp: '2026-08-04 16:45:33', ip: '192.168.1.14' },
];

export const bestSellingData = [
  { id: 1, medicine: 'Paracetamol 500mg', sold: 1240, revenue: '₹62,000', trend: '+12%' },
  { id: 2, medicine: 'Amoxicillin 250mg', sold: 890, revenue: '₹44,500', trend: '+8%' },
  { id: 3, medicine: 'Metformin 500mg', sold: 756, revenue: '₹37,800', trend: '+5%' },
  { id: 4, medicine: 'Omeprazole 20mg', sold: 620, revenue: '₹31,000', trend: '-2%' },
  { id: 5, medicine: 'Cetirizine 10mg', sold: 580, revenue: '₹17,400', trend: '+15%' },
];

export const posCartItems = [
  { id: 1, name: 'Paracetamol 500mg', price: 25, qty: 2 },
  { id: 2, name: 'Amoxicillin 250mg', price: 85, qty: 1 },
  { id: 3, name: 'Vitamin C 500mg', price: 120, qty: 1 },
];

export const availabilityData = [
  { id: 1, medicine: 'Paracetamol 500mg', category: 'Pain Relief', stock: 450, status: 'In Stock' },
  { id: 2, medicine: 'Amoxicillin 250mg', category: 'Antibiotics', stock: 45, status: 'Low Stock' },
  { id: 3, medicine: 'Ibuprofen 400mg', category: 'Pain Relief', stock: 0, status: 'Out of Stock' },
  { id: 4, medicine: 'Metformin 500mg', category: 'Diabetes Care', stock: 320, status: 'In Stock' },
];

export const loyaltyTiers = [
  { tier: 'Bronze', minPoints: 0, discount: '2%', members: 45, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { tier: 'Silver', minPoints: 500, discount: '5%', members: 28, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { tier: 'Gold', minPoints: 1500, discount: '8%', members: 12, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { tier: 'Platinum', minPoints: 5000, discount: '12%', members: 4, color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

export const reportSummary = {
  sales: { total: '₹4,82,350', orders: 342, avgOrder: '₹1,410', growth: '+18%' },
  inventory: { total: 156, value: '₹12,45,000', lowStock: 8, expired: 3 },
  profit: { revenue: '₹4,82,350', cost: '₹3,21,400', profit: '₹1,60,950', margin: '33.4%' },
  expiry: { expiring30: 12, expiring60: 24, expired: 3, value: '₹45,200' },
  purchase: { total: '₹2,85,000', orders: 28, pending: 2, suppliers: 4 },
  tax: { collected: '₹86,823', paid: '₹52,100', net: '₹34,723', rate: '18% GST' },
};

export const forecastData = [
  { medicine: 'Paracetamol 500mg', current: 450, forecast: 680, confidence: '92%' },
  { medicine: 'Amoxicillin 250mg', current: 45, forecast: 320, confidence: '88%' },
  { medicine: 'Metformin 500mg', current: 320, forecast: 410, confidence: '85%' },
  { medicine: 'Omeprazole 20mg', current: 28, forecast: 180, confidence: '79%' },
];

export const syncStatusData = [
  { module: 'Inventory', lastSync: '2026-08-05 14:30', status: 'Synced', records: 156 },
  { module: 'Sales', lastSync: '2026-08-05 14:28', status: 'Synced', records: 1042 },
  { module: 'Customers', lastSync: '2026-08-05 14:25', status: 'Synced', records: 89 },
  { module: 'Purchase', lastSync: '2026-08-05 14:20', status: 'Syncing', records: 87 },
];

export const usersData = [
  { id: 1, name: 'Admin User', email: 'admin@medstock.com', role: 'Admin', lastLogin: '2026-08-05 14:32', status: 'Active' },
  { id: 2, name: 'Dr. Priya Sharma', email: 'priya@medstock.com', role: 'Pharmacist', lastLogin: '2026-08-05 13:15', status: 'Active' },
  { id: 3, name: 'Raj Kumar', email: 'raj@medstock.com', role: 'Pharmacist', lastLogin: '2026-08-04 18:00', status: 'Active' },
];

export const apiKeysData = [
  { id: 1, name: 'Production API', key: 'msk_live_••••••••••••4f2a', created: '2025-06-15', lastUsed: '2026-08-05', status: 'Active' },
  { id: 2, name: 'Development API', key: 'msk_test_••••••••••••8b1c', created: '2025-08-01', lastUsed: '2026-08-03', status: 'Active' },
  { id: 3, name: 'Mobile App', key: 'msk_live_••••••••••••3d7e', created: '2026-01-10', lastUsed: 'Never', status: 'Inactive' },
];
