import {
  FiGrid,
  FiPackage,
  FiLayers,
  FiUploadCloud,
  FiPlusCircle,
  FiShoppingCart,
  FiShoppingBag,
  FiClock,
  FiBarChart2,
  FiTrendingUp,
  FiSettings,
  FiDatabase,
  FiMessageCircle,
} from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';

export const navigation = [
  {
    label: 'Dashboard',
    icon: FiGrid,
    to: '/dashboard',
  },
  {
    label: 'Customer Orders',
    icon: FiShoppingBag,
    to: '/orders',
  },
  {
    label: 'Messages',
    icon: FiMessageCircle,
    to: '/messages',
  },
  {
    label: 'Inventory',
    icon: FiPackage,
    children: [
      { label: 'Medicine Management', to: '/medicines', icon: TbPill },
      { label: 'Stock Management', to: '/inventory/stock', icon: FiLayers },
      { label: 'Add Stock', to: '/inventory/add-stock', icon: FiPlusCircle },
      { label: 'Import Medicines', to: '/inventory/import', icon: FiUploadCloud },
    ],
  },
  {
    label: 'Sales',
    icon: FiShoppingCart,
    children: [
      { label: 'Sales History', to: '/sales/history', icon: FiClock },
    ],
  },
  {
    label: 'Medicine Data',
    icon: FiDatabase,
    to: '/medicine-data',
  },
  {
    label: 'Reports',
    icon: FiBarChart2,
    children: [
      { label: 'Sales Report', to: '/reports/sales', icon: FiBarChart2 },
      { label: 'Profit Analysis', to: '/reports/profit', icon: FiTrendingUp },
    ],
  },
  {
    // Only Pharmacy Profile is real functionality today - User Management/
    // Security/API Keys are mock-data scaffolding with no backend behind
    // them, so they're deliberately not linked here (see pages/settings/
    // UserManagement.jsx, Security.jsx, ApiKeys.jsx - still reachable
    // directly by URL for future work, just not one click away). A single
    // real destination doesn't need its own collapsible section.
    label: 'Pharmacy Settings',
    icon: FiSettings,
    to: '/settings/profile',
  },
];
