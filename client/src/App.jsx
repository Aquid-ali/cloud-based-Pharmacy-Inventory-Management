import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Landing from './pages/Landing';
import ContactUs from './pages/info/ContactUs';
import FAQs from './pages/info/FAQs';
import PrivacyPolicy from './pages/info/PrivacyPolicy';
import TermsConditions from './pages/info/TermsConditions';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import Dashboard from './pages/Dashboard';
import MedicineList from './pages/MedicineList';
import AddMedicine from './pages/AddMedicine';
import EditMedicine from './pages/EditMedicine';
import MedicineDetails from './pages/MedicineDetails';
import NotFound from './pages/NotFound';

import DashboardLayout from './layouts/DashboardLayout';
import ShopLayout from './layouts/ShopLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Shop
import ShopHome from './pages/shop/Home';
import ShopSearchResults from './pages/shop/SearchResults';
import ShopMedicineDetail from './pages/shop/MedicineDetail';
import ShopStores from './pages/shop/Stores';
import ShopCart from './pages/shop/Cart';
import ShopCheckout from './pages/shop/Checkout';
import ShopOrders from './pages/shop/Orders';
import ShopOrderDetail from './pages/shop/OrderDetail';
import ShopAccount from './pages/shop/Account';

// Admin: customer orders
import CustomerOrders from './pages/orders/CustomerOrders';

// Admin: medicine data management (AI enrichment)
import MedicineDataManagement from './pages/admin/MedicineDataManagement';
import MedicineReview from './pages/admin/MedicineReview';

// Customer: medicine catalog
import MedicineSearch from './pages/customer/MedicineSearch';
import MedicineCatalogDetails from './pages/customer/MedicineDetails';

// Inventory
import StockManagement from './pages/inventory/StockManagement';
import AddStock from './pages/inventory/AddStock';
import ImportMedicines from './pages/inventory/ImportMedicines';
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
import ProfitAnalysis from './pages/reports/ProfitAnalysis';
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
      <Route path="/" element={<Landing />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/faqs" element={<FAQs />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />

      {/* Customer storefront */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <ShopLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/shop" element={<ShopHome />} />
        <Route path="/shop/search" element={<ShopSearchResults />} />
        <Route path="/shop/medicines/:id" element={<ShopMedicineDetail />} />
        <Route path="/shop/stores" element={<ShopStores />} />
        <Route path="/shop/cart" element={<ShopCart />} />
        <Route path="/shop/checkout" element={<ShopCheckout />} />
        <Route path="/shop/orders" element={<ShopOrders />} />
        <Route path="/shop/orders/:id" element={<ShopOrderDetail />} />
        <Route path="/shop/account" element={<ShopAccount />} />
      </Route>

      {/* Medicine catalog search (MedicineCatalog + Inventory + Pharmacy) is
          publicly browsable — only cart/purchase actions require sign-in
          (gated inline on the page itself). Shares ShopLayout's chrome but
          is intentionally NOT behind ProtectedRoute. */}
      <Route element={<ShopLayout />}>
        <Route path="/customer/medicines" element={<MedicineSearch />} />
        <Route path="/customer/medicines/:id" element={<MedicineCatalogDetails />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<CustomerOrders />} />

        {/* Medicine Data Management (AI enrichment) */}
        <Route path="/medicine-data" element={<MedicineDataManagement />} />
        <Route path="/medicine-data/review" element={<MedicineReview />} />

        {/* Inventory */}
        <Route path="/medicines" element={<MedicineList />} />
        <Route path="/medicines/add" element={<AddMedicine />} />
        <Route path="/medicines/edit/:id" element={<EditMedicine />} />
        <Route path="/medicines/:id" element={<MedicineDetails />} />
        <Route path="/inventory/stock" element={<StockManagement />} />
        <Route path="/inventory/add-stock" element={<AddStock />} />
        <Route path="/inventory/import" element={<ImportMedicines />} />
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
        <Route path="/reports/profit" element={<ProfitAnalysis />} />
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
