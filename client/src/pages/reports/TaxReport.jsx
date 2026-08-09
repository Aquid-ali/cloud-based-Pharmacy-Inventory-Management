import React from 'react';
import { FiFileText, FiDollarSign, FiTrendingUp, FiPercent } from 'react-icons/fi';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import { reportSummary } from '../../config/mockData';

const TaxReport = () => (
  <ReportPage
    title="Tax Report"
    description="GST collection, tax liability, and compliance reporting."
    stats={[
      { icon: FiDollarSign, label: 'Tax Collected', value: reportSummary.tax.collected, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiFileText, label: 'Tax Paid', value: reportSummary.tax.paid, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
      { icon: FiTrendingUp, label: 'Net Tax Liability', value: reportSummary.tax.net, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiPercent, label: 'Tax Rate', value: reportSummary.tax.rate, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
    ]}
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartPlaceholder title="Monthly Tax Collection" />
      <ChartPlaceholder title="Tax Breakdown by Category" />
    </div>
  </ReportPage>
);

export default TaxReport;
