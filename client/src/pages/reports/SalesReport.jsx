import React, { useEffect, useState } from 'react';
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ReportPage from '../../components/ReportPage';
import BarChart from '../../components/BarChart';
import DataTable from '../../components/DataTable';
import Spinner from '../../components/Spinner';
import { getSales, getSalesStats } from '../../services/saleService';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const formatPercent = (value) =>
  value === null || value === undefined ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const SalesReport = () => {
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, salesRes] = await Promise.all([getSalesStats(), getSales({ limit: 10 })]);
        setStats(statsRes.data.data);
        setSales(salesRes.data.data.sales);
      } catch {
        toast.error('Failed to load sales report');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner size="lg" />;

  const rows = sales.map((sale) => ({
    id: `#${sale._id.slice(-6).toUpperCase()}`,
    date: new Date(sale.createdAt).toLocaleDateString(),
    customer: sale.customerName || 'Walk-in Customer',
    total: formatCurrency(sale.totalAmount),
    payment: sale.paymentMethod,
  }));

  return (
    <ReportPage
      title="Sales Report"
      description="Analyze sales performance, revenue trends, and transaction data."
      stats={[
        { icon: FiDollarSign, label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue), bgTint: 'bg-brandPrimary/10', iconColor: 'text-brandPrimary', borderColor: 'border-brandPrimary/20' },
        { icon: FiShoppingBag, label: 'Total Orders', value: stats?.totalOrders ?? 0, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
        { icon: FiBarChart2, label: 'Avg. Order Value', value: formatCurrency(stats?.avgOrderValue), bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
        { icon: FiTrendingUp, label: 'Growth (MoM)', value: formatPercent(stats?.growthPercent), bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Monthly Revenue Trend"
          data={stats?.monthlyTrend || []}
          series={[
            { key: 'revenue', label: 'Revenue', color: 'bg-brandPrimary' },
            { key: 'profit', label: 'Profit', color: 'bg-accentCyan' },
          ]}
          valueFormatter={formatCurrency}
        />
        <BarChart
          title="Sales by Payment Method"
          data={(stats?.paymentMethodBreakdown || []).map((p) => ({ label: p.method, revenue: p.revenue }))}
          series={[{ key: 'revenue', label: 'Revenue', color: 'bg-brandPrimary' }]}
          valueFormatter={formatCurrency}
        />
      </div>
      <DataTable
        columns={[
          { key: 'id', label: 'Invoice' },
          { key: 'date', label: 'Date' },
          { key: 'customer', label: 'Customer' },
          { key: 'total', label: 'Amount' },
          { key: 'payment', label: 'Payment' },
        ]}
        data={rows}
        emptyTitle="No sales yet"
        emptyMessage="Recent sales from POS Billing will show up here."
      />
    </ReportPage>
  );
};

export default SalesReport;
