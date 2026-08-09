import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MedicineList from './pages/MedicineList';
import AddMedicine from './pages/AddMedicine';
import EditMedicine from './pages/EditMedicine';
import MedicineDetails from './pages/MedicineDetails';
import NotFound from './pages/NotFound';

import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Inventory
import StockManagement from './pages/inventory/StockManagement';
import Categories from './pages/inventory/Categories';
import Batches from './pages/inventory/Batches';
import Manufacturers from './pages/inventory/Manufacturers';
import Suppliers from './pages/inventory/Suppliers';

// Sales
import POSBilling from './pages/sales/POSBilling';
import SalesHistory from './pages/sales/SalesHistory';
import ReturnsRefunds from './pages/sales/ReturnsRefunds';
import Quotations from './pages/sales/Quotations';

// Purchase
import PurchaseOrders from './pages/purchase/PurchaseOrders';
import ReceiveStock from './pages/purchase/ReceiveStock';
import PurchaseHistory from './pages/purchase/PurchaseHistory';

// Customers
import CustomerList from './pages/customers/CustomerList';
import MedicineAvailability from './pages/customers/MedicineAvailability';
import Prescriptions from './pages/customers/Prescriptions';
import LoyaltyProgram from './pages/customers/LoyaltyProgram';

// Employees
import Staff from './pages/employees/Staff';
import RolesPermissions from './pages/employees/RolesPermissions';
import Attendance from './pages/employees/Attendance';

// Reports
import SalesReport from './pages/reports/SalesReport';
import InventoryReport from './pages/reports/InventoryReport';
import ProfitAnalysis from './pages/reports/ProfitAnalysis';
import ExpiryReport from './pages/reports/ExpiryReport';
import PurchaseReport from './pages/reports/PurchaseReport';
import TaxReport from './pages/reports/TaxReport';

// Analytics
import DashboardAnalytics from './pages/analytics/DashboardAnalytics';
import DemandForecast from './pages/analytics/DemandForecast';
import BestSellingMedicines from './pages/analytics/BestSellingMedicines';

// Notifications
import LowStockAlerts from './pages/notifications/LowStockAlerts';
import ExpiryAlerts from './pages/notifications/ExpiryAlerts';
import OrderNotifications from './pages/notifications/OrderNotifications';
import Messages from './pages/notifications/Messages';

// Cloud
import BackupRestore from './pages/cloud/BackupRestore';
import SyncStatus from './pages/cloud/SyncStatus';
import AuditLogs from './pages/cloud/AuditLogs';

// Settings
import PharmacyProfile from './pages/settings/PharmacyProfile';
import Taxes from './pages/settings/Taxes';
import Currency from './pages/settings/Currency';
import UserManagement from './pages/settings/UserManagement';
import Security from './pages/settings/Security';
import ApiKeys from './pages/settings/ApiKeys';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Inventory */}
        <Route path="/medicines" element={<MedicineList />} />
        <Route path="/medicines/add" element={<AddMedicine />} />
        <Route path="/medicines/edit/:id" element={<EditMedicine />} />
        <Route path="/medicines/:id" element={<MedicineDetails />} />
        <Route path="/inventory/stock" element={<StockManagement />} />
        <Route path="/inventory/categories" element={<Categories />} />
        <Route path="/inventory/batches" element={<Batches />} />
        <Route path="/inventory/manufacturers" element={<Manufacturers />} />
        <Route path="/inventory/suppliers" element={<Suppliers />} />

        {/* Sales */}
        <Route path="/sales/pos" element={<POSBilling />} />
        <Route path="/sales/history" element={<SalesHistory />} />
        <Route path="/sales/returns" element={<ReturnsRefunds />} />
        <Route path="/sales/quotations" element={<Quotations />} />

        {/* Purchase */}
        <Route path="/purchase/orders" element={<PurchaseOrders />} />
        <Route path="/purchase/receive" element={<ReceiveStock />} />
        <Route path="/purchase/history" element={<PurchaseHistory />} />

        {/* Customers */}
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/availability" element={<MedicineAvailability />} />
        <Route path="/customers/prescriptions" element={<Prescriptions />} />
        <Route path="/customers/loyalty" element={<LoyaltyProgram />} />

        {/* Employees */}
        <Route path="/employees/staff" element={<Staff />} />
        <Route path="/employees/roles" element={<RolesPermissions />} />
        <Route path="/employees/attendance" element={<Attendance />} />

        {/* Reports */}
        <Route path="/reports/sales" element={<SalesReport />} />
        <Route path="/reports/inventory" element={<InventoryReport />} />
        <Route path="/reports/profit" element={<ProfitAnalysis />} />
        <Route path="/reports/expiry" element={<ExpiryReport />} />
        <Route path="/reports/purchase" element={<PurchaseReport />} />
        <Route path="/reports/tax" element={<TaxReport />} />

        {/* Analytics */}
        <Route path="/analytics/dashboard" element={<DashboardAnalytics />} />
        <Route path="/analytics/forecast" element={<DemandForecast />} />
        <Route path="/analytics/best-selling" element={<BestSellingMedicines />} />

        {/* Notifications */}
        <Route path="/notifications/low-stock" element={<LowStockAlerts />} />
        <Route path="/notifications/expiry" element={<ExpiryAlerts />} />
        <Route path="/notifications/orders" element={<OrderNotifications />} />
        <Route path="/notifications/messages" element={<Messages />} />

        {/* Cloud */}
        <Route path="/cloud/backup" element={<BackupRestore />} />
        <Route path="/cloud/sync" element={<SyncStatus />} />
        <Route path="/cloud/audit" element={<AuditLogs />} />

        {/* Settings */}
        <Route path="/settings/profile" element={<PharmacyProfile />} />
        <Route path="/settings/taxes" element={<Taxes />} />
        <Route path="/settings/currency" element={<Currency />} />
        <Route path="/settings/users" element={<UserManagement />} />
        <Route path="/settings/security" element={<Security />} />
        <Route path="/settings/api-keys" element={<ApiKeys />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
