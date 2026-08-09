import React from 'react';
import { FiLayers, FiAlertTriangle, FiPackage, FiTrendingDown } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { stockData, Badge } from '../../config/mockData';

const columns = [
  { key: 'medicine', label: 'Medicine' },
  { key: 'sku', label: 'SKU' },
  { key: 'current', label: 'Current Stock' },
  { key: 'min', label: 'Min Level' },
  { key: 'max', label: 'Max Level' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const StockManagement = () => (
  <ListPage
    title="Stock Management"
    description="Monitor and adjust medicine stock levels across your inventory."
    stats={[
      { icon: FiPackage, label: 'Total Items', value: stockData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiLayers, label: 'In Stock', value: stockData.filter((s) => s.status === 'In Stock').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiAlertTriangle, label: 'Low Stock', value: stockData.filter((s) => s.status === 'Low Stock').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiTrendingDown, label: 'Out of Stock', value: stockData.filter((s) => s.status === 'Out of Stock').length, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
    ]}
    columns={columns}
    data={stockData}
    searchPlaceholder="Search medicines..."
    addLabel="Adjust Stock"
  />
);

export default StockManagement;
