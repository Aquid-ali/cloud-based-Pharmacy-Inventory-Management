import React, { useEffect, useState } from 'react';
import { FiTrendingUp, FiDollarSign, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import Spinner from '../../components/Spinner';
import { getSalesStats } from '../../services/saleService';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const ProfitAnalysis = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getSalesStats();
        setStats(data.data);
      } catch {
        toast.error('Failed to load profit analysis');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner size="lg" />;

  return (
    <ReportPage
      title="Profit Analysis"
      description="Track revenue, costs, and profit margins across your pharmacy."
      stats={[
        { icon: FiDollarSign, label: 'Revenue', value: formatCurrency(stats?.totalRevenue), bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
        { icon: FiBarChart2, label: 'Cost of Goods', value: formatCurrency(stats?.totalCost), bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
        { icon: FiTrendingUp, label: 'Net Profit', value: formatCurrency(stats?.totalProfit), bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
        { icon: FiPieChart, label: 'Profit Margin', value: `${(stats?.profitMargin ?? 0).toFixed(1)}%`, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder title="Profit Trend (Monthly)" />
        <ChartPlaceholder title="Revenue vs Cost Breakdown" />
      </div>
    </ReportPage>
  );
};

export default ProfitAnalysis;
