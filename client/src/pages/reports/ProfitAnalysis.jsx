import React from 'react';
import { FiTrendingUp, FiDollarSign, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import { reportSummary } from '../../config/mockData';

const ProfitAnalysis = () => (
  <ReportPage
    title="Profit Analysis"
    description="Track revenue, costs, and profit margins across your pharmacy."
    stats={[
      { icon: FiDollarSign, label: 'Revenue', value: reportSummary.profit.revenue, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiBarChart2, label: 'Cost of Goods', value: reportSummary.profit.cost, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
      { icon: FiTrendingUp, label: 'Net Profit', value: reportSummary.profit.profit, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiPieChart, label: 'Profit Margin', value: reportSummary.profit.margin, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
    ]}
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartPlaceholder title="Profit Trend (Monthly)" />
      <ChartPlaceholder title="Revenue vs Cost Breakdown" />
    </div>
  </ReportPage>
);

export default ProfitAnalysis;
