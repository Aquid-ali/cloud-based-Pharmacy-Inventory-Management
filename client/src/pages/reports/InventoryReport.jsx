import React from 'react';
import { FiPackage, FiDollarSign, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import DataTable from '../../components/DataTable';
import { reportSummary, stockData, Badge } from '../../config/mockData';

const InventoryReport = () => (
  <ReportPage
    title="Inventory Report"
    description="Overview of stock levels, inventory value, and stock health."
    stats={[
      { icon: FiPackage, label: 'Total Items', value: reportSummary.inventory.total, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiDollarSign, label: 'Inventory Value', value: reportSummary.inventory.value, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiAlertTriangle, label: 'Low Stock', value: reportSummary.inventory.lowStock, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiXCircle, label: 'Expired', value: reportSummary.inventory.expired, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
    ]}
  >
    <ChartPlaceholder title="Stock Distribution by Category" />
    <DataTable
      columns={[
        { key: 'medicine', label: 'Medicine' },
        { key: 'current', label: 'Stock' },
        { key: 'min', label: 'Min Level' },
        { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
      ]}
      data={stockData}
    />
  </ReportPage>
);

export default InventoryReport;
