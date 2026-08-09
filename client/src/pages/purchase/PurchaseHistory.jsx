import React from 'react';
import { FiClipboard, FiDollarSign, FiTruck, FiCheckCircle } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { purchaseHistoryData, Badge } from '../../config/mockData';

const columns = [
  { key: 'id', label: 'PO Number' },
  { key: 'date', label: 'Order Date' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'received', label: 'Received Date' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const PurchaseHistory = () => (
  <ListPage
    title="Purchase History"
    description="View completed purchase orders and delivery records."
    stats={[
      { icon: FiClipboard, label: 'Total Orders', value: purchaseHistoryData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiDollarSign, label: 'Total Spent', value: '₹69,700', bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiTruck, label: 'Suppliers', value: 3, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      { icon: FiCheckCircle, label: 'Completed', value: purchaseHistoryData.length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
    columns={columns}
    data={purchaseHistoryData}
    searchPlaceholder="Search purchase history..."
  />
);

export default PurchaseHistory;
