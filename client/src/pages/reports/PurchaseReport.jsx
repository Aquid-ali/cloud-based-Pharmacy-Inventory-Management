import React from 'react';
import { FiClipboard, FiDollarSign, FiClock, FiTruck } from 'react-icons/fi';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import DataTable from '../../components/DataTable';
import { reportSummary, purchaseHistoryData } from '../../config/mockData';

const PurchaseReport = () => (
  <ReportPage
    title="Purchase Report"
    description="Analyze purchase spending, supplier performance, and order trends."
    stats={[
      { icon: FiDollarSign, label: 'Total Spent', value: reportSummary.purchase.total, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiClipboard, label: 'Total Orders', value: reportSummary.purchase.orders, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiClock, label: 'Pending', value: reportSummary.purchase.pending, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiTruck, label: 'Suppliers', value: reportSummary.purchase.suppliers, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
    ]}
  >
    <ChartPlaceholder title="Monthly Purchase Spending" />
    <DataTable
      columns={[
        { key: 'id', label: 'PO Number' },
        { key: 'date', label: 'Date' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'total', label: 'Amount' },
        { key: 'received', label: 'Received' },
      ]}
      data={purchaseHistoryData}
    />
  </ReportPage>
);

export default PurchaseReport;
