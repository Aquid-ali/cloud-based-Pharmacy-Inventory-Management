import React from 'react';
import { FiAlertTriangle, FiClock, FiXCircle, FiDollarSign } from 'react-icons/fi';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import DataTable from '../../components/DataTable';
import { reportSummary, expiryAlerts, Badge } from '../../config/mockData';

const ExpiryReport = () => (
  <ReportPage
    title="Expiry Report"
    description="Monitor medicines nearing expiry and expired stock value."
    stats={[
      { icon: FiClock, label: 'Expiring in 30 days', value: reportSummary.expiry.expiring30, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiAlertTriangle, label: 'Expiring in 60 days', value: reportSummary.expiry.expiring60, bgTint: 'bg-orange-500/10', iconColor: 'text-orange-600', borderColor: 'border-orange-500/20' },
      { icon: FiXCircle, label: 'Already Expired', value: reportSummary.expiry.expired, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
      { icon: FiDollarSign, label: 'At-Risk Value', value: reportSummary.expiry.value, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
    ]}
  >
    <ChartPlaceholder title="Expiry Timeline" />
    <DataTable
      columns={[
        { key: 'medicine', label: 'Medicine' },
        { key: 'batch', label: 'Batch' },
        { key: 'expiry', label: 'Expiry Date' },
        { key: 'qty', label: 'Quantity' },
        { key: 'severity', label: 'Severity', render: (row) => <Badge status={row.severity} /> },
      ]}
      data={expiryAlerts}
    />
  </ReportPage>
);

export default ExpiryReport;
