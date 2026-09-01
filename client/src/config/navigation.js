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
  FiUsers,
  FiLock,
  FiKey,
  FiDatabase,
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
    label: 'Settings',
    icon: FiSettings,
    children: [
      { label: 'Pharmacy Profile', to: '/settings/profile', icon: FiSettings },
      { label: 'User Management', to: '/settings/users', icon: FiUsers },
      { label: 'Security', to: '/settings/security', icon: FiLock },
      { label: 'API Keys', to: '/settings/api-keys', icon: FiKey },
    ],
  },
];
