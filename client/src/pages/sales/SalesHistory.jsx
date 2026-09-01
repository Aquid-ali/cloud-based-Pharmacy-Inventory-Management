import React, { useEffect, useState } from 'react';
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ListPage from '../../components/ListPage';
import Spinner from '../../components/Spinner';
import { getSales, getSalesStats } from '../../services/saleService';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const columns = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'payment', label: 'Payment' },
];

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [salesRes, statsRes] = await Promise.all([getSales({ limit: 50 }), getSalesStats()]);
        setSales(salesRes.data.data.sales);
        setStats(statsRes.data.data);
      } catch {
        toast.error('Failed to load sales history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner size="lg" />;

  const rows = sales.map((sale) => ({
    invoice: `#${sale._id.slice(-6).toUpperCase()}`,
    date: new Date(sale.createdAt).toLocaleDateString(),
    customer: sale.customerName || 'Walk-in Customer',
    items: sale.items.reduce((sum, i) => sum + i.quantity, 0),
    total: formatCurrency(sale.totalAmount),
    payment: sale.paymentMethod,
  }));

  return (
    <ListPage
      title="Sales History"
      description="View and search all completed sales transactions."
      stats={[
        { icon: FiDollarSign, label: "Today's Sales", value: formatCurrency(stats?.todayRevenue), bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
        { icon: FiShoppingBag, label: 'Transactions', value: stats?.totalOrders ?? 0, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
        { icon: FiTrendingUp, label: 'This Month', value: formatCurrency(stats?.monthRevenue), bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
        { icon: FiClock, label: 'Avg. Order', value: formatCurrency(stats?.avgOrderValue), bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      ]}
      columns={columns}
      data={rows}
      searchPlaceholder="Search invoices..."
      emptyTitle="No sales yet"
      emptyMessage="Completed sales from POS Billing will show up here."
    />
  );
};

export default SalesHistory;
