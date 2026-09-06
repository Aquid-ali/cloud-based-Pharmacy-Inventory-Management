import {
  FiGrid,
  FiPackage,
  FiLayers,
  FiUploadCloud,
  FiPlusCircle,
  FiShoppingBag,
  FiClock,
  FiBarChart2,
  FiTrendingUp,
  FiSettings,
  FiDatabase,
  FiMessageCircle,
} from 'react-icons/fi';

// Flat, section-based structure - every item is always visible (no
// dropdown/expand state). Each section renders as a subtle-divided group in
// Sidebar.jsx; `variant: 'primary'` sections render at the top level of the
// visual hierarchy, everything else renders as slightly-indented section
// navigation. One consistent icon set (react-icons/fi) throughout.
export const navigation = [
  {
    section: 'Main',
    variant: 'primary',
    items: [
      { label: 'Dashboard', icon: FiGrid, to: '/dashboard' },
      { label: 'Customer Orders', icon: FiShoppingBag, to: '/orders' },
      { label: 'Messages', icon: FiMessageCircle, to: '/messages' },
    ],
  },
  {
    section: 'Inventory',
    items: [
      { label: 'Medicine Management', icon: FiPackage, to: '/medicines' },
      { label: 'Stock Management', icon: FiLayers, to: '/inventory/stock' },
      { label: 'Add Stock', icon: FiPlusCircle, to: '/inventory/add-stock' },
      { label: 'Import Medicines', icon: FiUploadCloud, to: '/inventory/import' },
    ],
  },
  {
    section: 'Sales',
    items: [{ label: 'Sales History', icon: FiClock, to: '/sales/history' }],
  },
  {
    section: 'Medicine Data',
    items: [{ label: 'AI Enrichment', icon: FiDatabase, to: '/medicine-data' }],
  },
  {
    section: 'Analytics & Reports',
    items: [
      { label: 'Sales Report', icon: FiBarChart2, to: '/reports/sales' },
      { label: 'Profit Analysis', icon: FiTrendingUp, to: '/reports/profit' },
    ],
  },
  {
    // Only Pharmacy Profile is real functionality today - User Management/
    // Security/API Keys are mock-data scaffolding with no backend behind
    // them, so they're deliberately not linked here (see pages/settings/
    // UserManagement.jsx, Security.jsx, ApiKeys.jsx - still reachable
    // directly by URL for future work, just not one click away).
    section: 'Settings',
    items: [{ label: 'Pharmacy Settings', icon: FiSettings, to: '/settings/profile' }],
  },
];
