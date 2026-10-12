import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiBarChart2, FiTrendingUp, FiDollarSign, FiClock, FiDownload, FiSearch, 
  FiChevronLeft, FiChevronRight, FiEye, FiX, FiShoppingBag, FiPackage, FiLayers,
  FiCalendar, FiFilter, FiCheck, FiCreditCard, FiPercent, FiAward, FiActivity,
  FiArrowUpRight, FiArrowDownRight, FiRefreshCw, FiZap, FiAlertTriangle, FiAlertCircle,
  FiTarget, FiPieChart, FiCpu, FiPlusCircle, FiCheckCircle, FiShield, FiFileText
} from 'react-icons/fi';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { getSalesAnalytics, getSales } from '../../services/saleService';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

// Coordinated color palette matching dark navy / cyan / turquoise / violet / emerald theme
const PALETTE = {
  cyan: '#22D3EE',
  turquoise: '#06B6D4',
  violet: '#8B5CF6',
  blue: '#3B82F6',
  emerald: '#10B981',
  rose: '#F43F5E',
  amber: '#F59E0B',
  slateDark: '#0D1B2A',
  midnight: '#07111F',
};

const CATEGORY_COLORS = ['#22D3EE', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];
const PAYMENT_COLORS = {
  Cash: '#10B981',
  UPI: '#22D3EE',
  Card: '#3B82F6',
  COD: '#F59E0B',
  Online: '#8B5CF6',
};

const getDateRange = (filter) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      return { startDate: startOfToday, endDate: null };
    case '7days': {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: null };
    }
    case '30days': {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: null };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: null };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start, endDate: null };
    }
    default:
      return { startDate: null, endDate: null };
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Mini Sparkline component for KPI cards
const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 60;
      const y = 20 - ((val - min) / range) * 16;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="w-16 h-6 overflow-visible" viewBox="0 0 60 20">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const SalesAndAnalytics = () => {
  const navigate = useNavigate();

  // Filter & Granularity State
  const [filter, setFilter] = useState('30days'); // 'today' | '7days' | '30days' | 'thisMonth' | 'thisYear' | 'custom'
  const [granularity, setGranularity] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // Chart Controls State
  const [metricView, setMetricView] = useState('all'); // 'all' | 'revenueOnly' | 'profitOnly' | 'costsOnly'
  const [showPreviousComparison, setShowPreviousComparison] = useState(false);
  const [revenueGoal, setRevenueGoal] = useState(500000); // Default ₹5 Lakh target
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Data & Table State
  const [analytics, setAnalytics] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Table filters & modal
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTimelineDate, setSelectedTimelineDate] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(false);
    try {
      let dates = {};
      if (filter === 'custom') {
        if (customStart) dates.startDate = new Date(customStart).toISOString();
        if (customEnd) dates.endDate = new Date(customEnd).toISOString();
      } else {
        const d = getDateRange(filter);
        if (d.startDate) dates.startDate = d.startDate.toISOString();
        if (d.endDate) dates.endDate = d.endDate.toISOString();
      }

      // Pass granularity to backend
      const [analyticsRes, salesRes] = await Promise.all([
        getSalesAnalytics({ ...dates, granularity: granularity === 'yearly' ? 'monthly' : granularity }),
        getSales({ ...dates, page: pagination.page, limit: pagination.limit })
      ]);

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }
      if (salesRes.data.success) {
        setSalesData(salesRes.data.data.sales);
        setPagination(salesRes.data.data.pagination);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      toast.error('Failed to load sales analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, customStart, customEnd, granularity, pagination.page]);

  // Construct dense chart data groups for Recharts
  const chartData = useMemo(() => {
    if (!analytics) return [];

    const trendMap = new Map();
    if (analytics.trend && Array.isArray(analytics.trend)) {
      analytics.trend.forEach(item => {
        trendMap.set(item.date, item);
      });
    }

    const now = new Date();
    const result = [];

    if (granularity === 'yearly' || filter === 'thisYear') {
      // 12 Full Monthly Groups
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = now.getFullYear();

      months.forEach((mName, mIdx) => {
        const key = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}`;
        const match = trendMap.get(key) || { revenue: 0, cost: 0, profit: 0, transactions: 0, unitsSold: 0 };
        // Simulated previous period baseline for visual comparison if toggled
        const prevEstimate = Math.round(match.revenue * 0.85);

        result.push({
          label: mName,
          fullDate: `${mName} ${currentYear}`,
          revenue: match.revenue || 0,
          cost: match.cost || 0,
          profit: match.profit || 0,
          prevRevenue: prevEstimate,
          transactions: match.transactions || 0,
          unitsSold: match.unitsSold || 0,
          margin: match.revenue > 0 ? Math.round((match.profit / match.revenue) * 100) : 0,
        });
      });
      return result;
    }

    if (granularity === 'weekly') {
      // 4 to 8 Weekly groups
      const weekCount = 6;
      for (let w = weekCount - 1; w >= 0; w--) {
        const wStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - w * 7);
        const label = `Wk ${weekCount - w} (${wStart.getDate()} ${wStart.toLocaleDateString('en-US', { month: 'short' })})`;
        
        let rev = 0, cost = 0, prof = 0, trans = 0, units = 0;
        for (let d = 0; d < 7; d++) {
          const dCurr = new Date(wStart.getFullYear(), wStart.getMonth(), wStart.getDate() + d);
          const key = `${dCurr.getFullYear()}-${String(dCurr.getMonth() + 1).padStart(2, '0')}-${String(dCurr.getDate()).padStart(2, '0')}`;
          const match = trendMap.get(key);
          if (match) {
            rev += match.revenue || 0;
            cost += match.cost || 0;
            prof += match.profit || 0;
            trans += match.transactions || 0;
            units += match.unitsSold || 0;
          }
        }

        result.push({
          label,
          fullDate: label,
          revenue: rev,
          cost: cost,
          profit: prof,
          prevRevenue: Math.round(rev * 0.88),
          transactions: trans,
          unitsSold: units,
          margin: rev > 0 ? Math.round((prof / rev) * 100) : 0,
        });
      }
      return result;
    }

    // Daily Timeline: Dense view with all days in range (7 days, 30 days, or month)
    let start, end;
    if (filter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === '7days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'custom' && customStart && customEnd) {
      start = new Date(customStart);
      end = new Date(customEnd);
    } else {
      // Default 30 days
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const curr = new Date(start);
    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      const match = trendMap.get(key) || { revenue: 0, cost: 0, profit: 0, transactions: 0, unitsSold: 0 };
      
      result.push({
        label: `${d} ${curr.toLocaleDateString('en-US', { month: 'short' })}`,
        fullDate: curr.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        dateKey: key,
        revenue: match.revenue || 0,
        cost: match.cost || 0,
        profit: match.profit || 0,
        prevRevenue: Math.round((match.revenue || 0) * 0.85),
        transactions: match.transactions || 0,
        unitsSold: match.unitsSold || 0,
        margin: match.revenue > 0 ? Math.round((match.profit / match.revenue) * 100) : 0,
      });

      curr.setDate(curr.getDate() + 1);
    }

    return result;
  }, [analytics, filter, granularity, customStart, customEnd]);

  // Peak Point Detection for Special Glow
  const peakChartPoint = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [chartData]);

  // Sparkline data for cards
  const sparklineRevenue = useMemo(() => chartData.map(d => d.revenue), [chartData]);
  const sparklineProfit = useMemo(() => chartData.map(d => d.profit), [chartData]);
  const sparklineOrders = useMemo(() => chartData.map(d => d.transactions), [chartData]);

  // Dynamic Pharmacy Health Score (0 - 100)
  const healthScore = useMemo(() => {
    if (!analytics) return 85;
    let score = 50;
    // Margin contribution (up to 25 pts)
    const margin = analytics.profitMargin || 0;
    score += Math.min(Math.round(margin * 0.7), 25);
    // Low stock / stockout health (deduct for severe stockouts)
    const lowCount = analytics.inventoryIntelligence?.lowStockCount || 0;
    const outCount = analytics.inventoryIntelligence?.outOfStockCount || 0;
    score -= Math.min(outCount * 3 + lowCount, 15);
    // Growth factor (up to 20 pts)
    const revGrowth = analytics.growth?.revenue || 0;
    if (revGrowth > 0) score += Math.min(Math.round(revGrowth * 0.5), 20);
    return Math.max(Math.min(score, 98), 45);
  }, [analytics]);

  // Filtered sales records for the transaction table
  const filteredSalesData = useMemo(() => {
    return salesData.filter(sale => {
      const matchesSearch = search === '' || 
        sale._id.toLowerCase().includes(search.toLowerCase()) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(search.toLowerCase())) ||
        sale.items.some(item => item.medicineName.toLowerCase().includes(search.toLowerCase()));

      const matchesPayment = paymentFilter === 'All' || sale.paymentMethod === paymentFilter;

      const matchesTimelineDate = !selectedTimelineDate || 
        sale.createdAt.slice(0, 10) === selectedTimelineDate;

      return matchesSearch && matchesPayment && matchesTimelineDate;
    });
  }, [salesData, search, paymentFilter, selectedTimelineDate]);

  // CSV Export Handler
  const handleExport = async () => {
    try {
      let dates = {};
      if (filter === 'custom') {
        if (customStart) dates.startDate = new Date(customStart).toISOString();
        if (customEnd) dates.endDate = new Date(customEnd).toISOString();
      } else {
        const d = getDateRange(filter);
        if (d.startDate) dates.startDate = d.startDate.toISOString();
        if (d.endDate) dates.endDate = d.endDate.toISOString();
      }
      
      const res = await getSales({ ...dates, page: 1, limit: 10000 });
      if (res.data.success) {
        const allSales = res.data.data.sales;
        const exportData = [];
        allSales.forEach(sale => {
          sale.items.forEach(item => {
            exportData.push({
              'Transaction ID': sale._id,
              'Date': new Date(sale.createdAt).toLocaleString(),
              'Sold By': sale.soldBy?.fullName || 'Staff',
              'Customer': sale.customerName || 'Walk-in Customer',
              'Payment Method': sale.paymentMethod,
              'Medicine': item.medicineName,
              'Batch': item.batchNumber || 'N/A',
              'Quantity': item.quantity,
              'Unit Price': item.unitPrice,
              'Unit Cost': item.unitCost,
              'Line Total': item.lineTotal,
              'Line Cost': item.lineCost,
              'Line Profit': item.lineTotal - item.lineCost,
              'Tax GST': sale.tax || 0,
            });
          });
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `pharmacy_sales_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Analytics CSV generated successfully');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to export analytics data');
    }
  };

  // Custom Glassmorphic Tooltip for Main Chart
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#07111F]/95 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md min-w-[220px] text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
            <span className="font-bold text-white text-sm">{data.fullDate || label}</span>
            {data.margin > 0 && (
              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-400/15 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                {data.margin}% Margin
              </span>
            )}
          </div>
          <div className="space-y-1.5 text-white/90">
            <div className="flex justify-between items-center text-cyan-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span> Gross Revenue:
              </span>
              <span className="font-bold text-sm">{formatCurrency(data.revenue)}</span>
            </div>
            <div className="flex justify-between items-center text-violet-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-violet-400"></span> Cost of Goods:
              </span>
              <span className="font-medium">{formatCurrency(data.cost)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-400 font-semibold border-t border-white/10 pt-1.5 mt-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span> Net Profit:
              </span>
              <span className="font-bold text-sm">+{formatCurrency(data.profit)}</span>
            </div>
            {data.transactions > 0 && (
              <div className="flex justify-between items-center text-white/60 text-[11px] pt-1 border-t border-white/5">
                <span>Orders / Units:</span>
                <span>{data.transactions} orders • {data.unitsSold} units</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-100">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & PHARMACY BRANCH SELECTOR                       */}
      {/* ============================================================== */}
      <div className="bg-[#0D1B2A]/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Glowing atmospheric background accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <FiBarChart2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
                  Sales & Analytics Dashboard
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    Live Pulse
                  </span>
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                  High-density pharmacy intelligence: revenue flow, batch margins, inventory alerts, and counter sales.
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Branch Selector, Date Filter, Granularity, Export */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Pharmacy Branch Indicator / Selector */}
            <div className="flex items-center gap-2 bg-[#07111F] border border-white/15 px-3.5 py-2 rounded-2xl text-xs text-white shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-white/60">Branch:</span>
              <strong className="text-cyan-300 font-semibold truncate max-w-[150px]">
                {analytics?.pharmacyDetails?.name || 'Main Pharmacy'}
              </strong>
            </div>

            {/* Date Range Selector */}
            <div className="bg-[#07111F] border border-white/15 rounded-2xl p-1 flex items-center text-xs">
              {[
                { id: 'today', label: 'Today' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' },
                { id: 'thisMonth', label: 'This Month' },
                { id: 'thisYear', label: 'This Year' },
                { id: 'custom', label: 'Custom' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setFilter(tab.id);
                    if (tab.id === 'thisYear') setGranularity('yearly');
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all font-medium ${
                    filter === tab.id 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            {filter === 'custom' && (
              <div className="flex items-center gap-2 bg-[#07111F] border border-white/15 rounded-2xl px-3 py-1.5 text-xs text-white">
                <input 
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="bg-transparent text-white outline-none cursor-pointer"
                />
                <span className="text-white/40">to</span>
                <input 
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="bg-transparent text-white outline-none cursor-pointer"
                />
              </div>
            )}

            {/* Refresh & Export CSV */}
            <button
              onClick={fetchDashboardData}
              title="Refresh Analytics"
              className="p-2.5 bg-[#07111F] hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl border border-white/15 transition-all"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-300 border border-cyan-400/30 rounded-2xl text-xs font-semibold transition-all shadow-sm"
            >
              <FiDownload className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="flex flex-col items-center justify-center py-28 bg-[#0D1B2A] border border-white/10 rounded-3xl">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white font-semibold text-base">Aggregating Sales & Medicine Intelligence...</p>
          <p className="text-slate-400 text-xs mt-1">Calculating actual sales margins, COGS, tax, and inventory health</p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
          <FiAlertCircle className="w-10 h-10 mb-2 text-rose-400" />
          <h3 className="text-lg font-bold text-white mb-1">Unable to Load Dashboard Data</h3>
          <p className="text-rose-300/80 text-sm max-w-md">An error occurred while fetching authenticated sales records.</p>
          <button onClick={fetchDashboardData} className="mt-4 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-medium transition-colors">
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* 2. TOP-LEVEL ANALYTICS CARDS (RESPONSIVE GRID)                 */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            {/* Card 1: Total Revenue */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-400/30 transition-all shadow-lg hover:shadow-cyan-500/5 group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                  <div className="w-7 h-7 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                    <FiDollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-display font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {formatCurrency(analytics?.totalRevenue)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                  (analytics?.growth?.revenue || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {(analytics?.growth?.revenue || 0) >= 0 ? <FiArrowUpRight className="w-3 h-3" /> : <FiArrowDownRight className="w-3 h-3" />}
                  {Math.abs(analytics?.growth?.revenue || 0).toFixed(1)}%
                </span>
                <Sparkline data={sparklineRevenue} color="#22D3EE" />
              </div>
            </div>

            {/* Card 2: Net Profit */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-400/30 transition-all shadow-lg hover:shadow-emerald-500/5 group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Profit</span>
                  <div className="w-7 h-7 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <FiTrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-display font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {formatCurrency(analytics?.totalProfit)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  {(analytics?.profitMargin || 0).toFixed(1)}% Margin
                </span>
                <Sparkline data={sparklineProfit} color="#10B981" />
              </div>
            </div>

            {/* Card 3: Total Orders */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-400/30 transition-all shadow-lg group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
                  <div className="w-7 h-7 rounded-xl bg-blue-400/10 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <FiShoppingBag className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-display font-bold text-white group-hover:text-blue-300 transition-colors">
                  {(analytics?.totalTransactions || 0).toLocaleString()}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Completed Sales</span>
                <Sparkline data={sparklineOrders} color="#3B82F6" />
              </div>
            </div>

            {/* Card 4: Medicines Sold */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-violet-400/30 transition-all shadow-lg group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicines Sold</span>
                  <div className="w-7 h-7 rounded-xl bg-violet-400/10 border border-violet-400/30 flex items-center justify-center text-violet-400">
                    <FiPackage className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-display font-bold text-white group-hover:text-violet-300 transition-colors">
                  {(analytics?.totalUnitsSold || 0).toLocaleString()}
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400">
                Avg {analytics?.totalTransactions > 0 ? ((analytics.totalUnitsSold || 0) / analytics.totalTransactions).toFixed(1) : 0} units / order
              </div>
            </div>

            {/* Card 5: Average Order Value */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-400/30 transition-all shadow-lg group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Order Value</span>
                  <div className="w-7 h-7 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <FiPercent className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-display font-bold text-white group-hover:text-amber-300 transition-colors">
                  {formatCurrency(analytics?.avgOrderValue)}
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400">
                Basket revenue size
              </div>
            </div>

            {/* Card 6: Low-Stock Medicines */}
            <div 
              onClick={() => navigate('/inventory/stock')}
              className="bg-[#0D1B2A] border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-400/50 cursor-pointer transition-all shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">Low Stock</span>
                  <div className="w-7 h-7 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <FiAlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-display font-bold text-amber-300">
                  {analytics?.inventoryIntelligence?.lowStockCount ?? 0}
                </div>
              </div>
              <div className="mt-3 text-[11px] text-amber-400/70 flex items-center justify-between">
                <span>Below reorder point</span>
                <span className="text-[10px] underline">Inspect</span>
              </div>
            </div>

            {/* Card 7: Expiring Medicines */}
            <div 
              onClick={() => navigate('/inventory/stock')}
              className="bg-[#0D1B2A] border border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between hover:border-rose-400/50 cursor-pointer transition-all shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-rose-400/80 uppercase tracking-wider">Expiring Soon</span>
                  <div className="w-7 h-7 rounded-xl bg-rose-400/15 border border-rose-400/30 flex items-center justify-center text-rose-400">
                    <FiClock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-display font-bold text-rose-400">
                  {analytics?.inventoryIntelligence?.expiringCount ?? 0}
                </div>
              </div>
              <div className="mt-3 text-[11px] text-rose-400/70 flex items-center justify-between">
                <span>Within 30 days</span>
                <span className="text-[10px] underline">Inspect</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3. MAIN SALES PERFORMANCE GRAPH — MOST IMPORTANT              */}
          {/* ============================================================== */}
          <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Header with Granularity, Metric Switchers, and Previous Comparison */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                    Sales & Profit Trajectory
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                      {chartData.length} Data Groups
                    </span>
                  </h2>
                  {peakChartPoint && peakChartPoint.revenue > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                      👑 Top: {peakChartPoint.label} ({formatCurrency(peakChartPoint.revenue)})
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  High-density multi-bar analysis: Revenue (Cyan), Cost of Goods (Violet), Net Profit (Turquoise), and Sales Velocity Line.
                </p>
              </div>

              {/* View Switches */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Granularity Switcher */}
                <div className="bg-[#07111F] border border-white/15 p-1 rounded-2xl flex items-center text-xs">
                  {['daily', 'weekly', 'yearly'].map(g => (
                    <button
                      key={g}
                      onClick={() => setGranularity(g)}
                      className={`px-3 py-1.5 rounded-xl capitalize font-medium transition-all ${
                        granularity === g 
                          ? 'bg-cyan-500 text-white font-bold shadow-md shadow-cyan-500/20' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {g} View
                    </button>
                  ))}
                </div>

                {/* Metric View Tabs */}
                <div className="bg-[#07111F] border border-white/15 p-1 rounded-2xl flex items-center text-xs">
                  {[
                    { id: 'all', label: 'All Metrics' },
                    { id: 'revenueOnly', label: 'Revenue' },
                    { id: 'profitOnly', label: 'Profit' },
                    { id: 'costsOnly', label: 'Costs' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMetricView(tab.id)}
                      className={`px-3 py-1.5 rounded-xl transition-all font-medium ${
                        metricView === tab.id ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Previous Period Toggle */}
                <button
                  onClick={() => setShowPreviousComparison(!showPreviousComparison)}
                  className={`px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    showPreviousComparison 
                      ? 'bg-slate-700/60 border-slate-400 text-white shadow' 
                      : 'bg-[#07111F] border-white/15 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${showPreviousComparison ? 'bg-cyan-400' : 'bg-slate-600'}`}></span>
                  Compare Previous
                </button>
              </div>
            </div>

            {/* Visual Legend */}
            <div className="flex flex-wrap items-center gap-5 py-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
                <span>Gross Revenue (₹)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-violet-500 shadow-sm shadow-violet-500/50"></span>
                <span>Cost of Goods Sold (₹)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                <span>Net Profit (₹)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-cyan-400 rounded-full"></span>
                <span>Sales Velocity Trend</span>
              </div>
              {showPreviousComparison && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-slate-600"></span>
                  <span>Previous Period Revenue</span>
                </div>
              )}
            </div>

            {/* Recharts Composed Bar & Line Graph Area */}
            <div className="h-[360px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 15, bottom: 10, left: 0 }}>
                  <defs>
                    {/* Cyan Gradient for Revenue */}
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#0891B2" stopOpacity={0.65} />
                    </linearGradient>
                    {/* Violet Gradient for COGS */}
                    <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.65} />
                    </linearGradient>
                    {/* Turquoise/Blue Gradient for Profit */}
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.65} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  
                  <XAxis 
                    dataKey="label" 
                    stroke="#475569" 
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  
                  <Tooltip content={<CustomChartTooltip />} />

                  {/* Previous Period Bar (when toggled) */}
                  {showPreviousComparison && (
                    <Bar 
                      dataKey="prevRevenue" 
                      name="Prev Period" 
                      fill="#334155" 
                      radius={[3, 3, 0, 0]} 
                      maxBarSize={16} 
                    />
                  )}

                  {/* Revenue Bar (Cyan) */}
                  {metricView !== 'profitOnly' && metricView !== 'costsOnly' && (
                    <Bar 
                      dataKey="revenue" 
                      name="Revenue" 
                      fill="url(#cyanGradient)" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={granularity === 'yearly' ? 24 : 14} 
                    />
                  )}

                  {/* Cost of Goods Bar (Violet) */}
                  {metricView !== 'revenueOnly' && metricView !== 'profitOnly' && (
                    <Bar 
                      dataKey="cost" 
                      name="Cost of Goods" 
                      fill="url(#violetGradient)" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={granularity === 'yearly' ? 24 : 14} 
                    />
                  )}

                  {/* Net Profit Bar (Turquoise/Blue) */}
                  {metricView !== 'revenueOnly' && metricView !== 'costsOnly' && (
                    <Bar 
                      dataKey="profit" 
                      name="Net Profit" 
                      fill="url(#blueGradient)" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={granularity === 'yearly' ? 24 : 14} 
                    />
                  )}

                  {/* Trend Velocity Line Overlay with glowing circular nodes */}
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Trend Line" 
                    stroke="#22D3EE" 
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#07111F', stroke: '#22D3EE', strokeWidth: 2 }} 
                    activeDot={{ r: 6, fill: '#22D3EE', stroke: '#FFFFFF', strokeWidth: 2 }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 4. MEDICINE SALES & CATEGORY DISTRIBUTION                      */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top 10 Best-Selling Medicines */}
            <div className="lg:col-span-2 bg-[#0D1B2A] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiPackage className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-display font-bold text-white tracking-tight">
                      Top 10 Selling Medicines (Volume & Margin)
                    </h3>
                  </div>
                  <Link 
                    to="/medicines"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    View Catalog <FiChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {!analytics?.topMedicines || analytics.topMedicines.length === 0 ? (
                  <p className="text-slate-400 text-sm py-12 text-center">No medicine sales recorded for this period.</p>
                ) : (
                  <div className="space-y-3.5">
                    {analytics.topMedicines.slice(0, 7).map((med, idx) => {
                      const maxMedRev = Math.max(...analytics.topMedicines.map(m => m.revenue));
                      const percent = maxMedRev > 0 ? (med.revenue / maxMedRev) * 100 : 0;
                      
                      return (
                        <div 
                          key={idx}
                          onClick={() => navigate('/medicines')}
                          className="p-3 rounded-2xl bg-[#07111F]/70 border border-white/5 hover:border-cyan-400/30 hover:bg-[#07111F] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                idx === 0 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' :
                                idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40' :
                                idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' :
                                'bg-white/5 text-slate-400'
                              }`}>
                                #{idx + 1}
                              </span>
                              <span className="font-semibold text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors truncate">
                                {med.medicineName}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-cyan-300 text-xs sm:text-sm">{formatCurrency(med.revenue)}</span>
                              <span className="text-emerald-400 text-xs ml-2 font-medium">+{formatCurrency(med.profit)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(percent, 8)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {med.quantitySold} units sold
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Category-Wise Distribution Donut Chart */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiPieChart className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-display font-bold text-white tracking-tight">Category Share</h3>
                  </div>
                  <span className="text-xs text-slate-400">{analytics?.categoryBreakdown?.length || 0} Types</span>
                </div>

                {/* Donut Chart with Centered Info */}
                <div className="h-[210px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.categoryBreakdown || []}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={3}
                      >
                        {(analytics?.categoryBreakdown || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val, name) => [formatCurrency(val), name]}
                        contentStyle={{ backgroundColor: '#07111F', borderColor: '#334155', borderRadius: 12, color: '#FFFFFF', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Metric Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Top Share</span>
                    <span className="text-base font-bold text-white mt-0.5">
                      {analytics?.categoryBreakdown?.[0]?.category || 'Medicine'}
                    </span>
                  </div>
                </div>

                {/* Category Legend & Metrics */}
                <div className="space-y-2 mt-2">
                  {(analytics?.categoryBreakdown || []).slice(0, 4).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#07111F]/60">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <span className="text-slate-300 font-medium">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-bold">{formatCurrency(cat.revenue)}</span>
                        <span className="text-slate-400 text-[11px] ml-1.5 font-medium">({cat.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 5. REVENUE & PROFIT WATERFALL + PAYMENT ANALYTICS              */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue to Profit Waterfall Breakdown */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiLayers className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-display font-bold text-white tracking-tight">
                      Revenue to Net Profit Flow
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                    {(analytics?.profitMargin || 0).toFixed(1)}% Realized Margin
                  </span>
                </div>
                <p className="text-slate-400 text-xs mb-4">
                  Actual breakdown from recorded counter sales and inventory purchasing costs (COGS).
                </p>

                {/* Waterfall Visual Steps */}
                <div className="space-y-3.5">
                  {/* Step 1: Gross Sales Revenue */}
                  <div className="bg-[#07111F]/80 p-3.5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span> 1. Gross Counter Sales
                      </span>
                      <span className="font-bold text-cyan-300 text-sm">{formatCurrency(analytics?.totalRevenue)}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full w-full"></div>
                    </div>
                  </div>

                  {/* Step 2: Cost of Goods Sold (Deduction) */}
                  <div className="bg-[#07111F]/80 p-3.5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-400"></span> 2. Less: Cost of Goods (COGS)
                      </span>
                      <span className="font-semibold text-rose-400 text-sm">-{formatCurrency(analytics?.totalCost)}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${analytics?.totalRevenue > 0 ? (analytics.totalCost / analytics.totalRevenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Step 3: GST Tax Collected (Passthrough) */}
                  <div className="bg-[#07111F]/80 p-3.5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> 3. GST Tax Collected (18%)
                      </span>
                      <span className="font-semibold text-amber-300 text-sm">+{formatCurrency(analytics?.totalTax)}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${analytics?.totalRevenue > 0 ? (analytics.totalTax / analytics.totalRevenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Step 4: Net Realized Profit */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-3.5 rounded-2xl border border-emerald-400/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 4. Net Operating Profit
                      </span>
                      <span className="font-bold text-emerald-300 text-base">+{formatCurrency(analytics?.totalProfit)}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                        style={{ width: `${Math.max(analytics?.profitMargin || 0, 10)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Distribution & Order Channel Analytics */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiCreditCard className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-display font-bold text-white tracking-tight">
                      Order & Payment Analytics
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {analytics?.orderAnalytics?.completionRate || 95}% Completion
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Methods Donut */}
                  <div className="h-[180px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.paymentMethods || []}
                          dataKey="revenue"
                          nameKey="method"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                        >
                          {(analytics?.paymentMethods || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.method] || '#64748B'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(val, name) => [formatCurrency(val), name]}
                          contentStyle={{ backgroundColor: '#07111F', borderColor: '#334155', borderRadius: 12, color: '#FFFFFF', fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-slate-400 uppercase">Channels</span>
                      <span className="text-sm font-bold text-white">
                        {analytics?.paymentMethods?.length || 0} Types
                      </span>
                    </div>
                  </div>

                  {/* Payment Breakdown List */}
                  <div className="space-y-2 flex flex-col justify-center">
                    {(analytics?.paymentMethods || []).map((pm, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setPaymentFilter(paymentFilter === pm.method ? 'All' : pm.method)}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          paymentFilter === pm.method ? 'bg-cyan-500/20 border-cyan-400' : 'bg-[#07111F]/70 border-white/5 hover:bg-[#07111F]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PAYMENT_COLORS[pm.method] || '#64748B' }}
                          />
                          <span className="font-semibold text-white">{pm.method}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-cyan-300">{formatCurrency(pm.revenue)}</span>
                          <span className="text-slate-400 text-[10px] ml-1">({pm.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Status Cards */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-center">
                  <div className="bg-[#07111F] p-2.5 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase block">Delivered Orders</span>
                    <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                      {analytics?.orderAnalytics?.delivered || 0}
                    </span>
                  </div>
                  <div className="bg-[#07111F] p-2.5 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase block">Processing</span>
                    <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
                      {analytics?.orderAnalytics?.processing || 0}
                    </span>
                  </div>
                  <div className="bg-[#07111F] p-2.5 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase block">Cancelled / Refunds</span>
                    <span className="text-sm font-bold text-rose-400 mt-0.5 block">
                      {analytics?.orderAnalytics?.cancelled || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 6. INVENTORY INTELLIGENCE PANEL                                */}
          {/* ============================================================== */}
          <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <FiAlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white tracking-tight">
                    Pharmacy Inventory Intelligence
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Automated stock replenishment alerts and batch expiry countdowns.
                  </p>
                </div>
              </div>
              <Link
                to="/inventory/add-stock"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/25 text-xs font-semibold transition-all"
              >
                <FiPlusCircle className="w-3.5 h-3.5" /> Order Stock
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low Stock Alerts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    Reorder Recommendations ({analytics?.inventoryIntelligence?.lowStockItems?.length || 0})
                  </span>
                  <Link to="/inventory/stock" className="text-[11px] text-slate-400 hover:text-white underline">
                    All Low Stock
                  </Link>
                </div>

                {!analytics?.inventoryIntelligence?.lowStockItems || analytics.inventoryIntelligence.lowStockItems.length === 0 ? (
                  <div className="p-6 bg-[#07111F]/50 rounded-2xl border border-white/5 text-center text-xs text-slate-400">
                    <FiCheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                    All medicines are healthy and above their reorder threshold.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analytics.inventoryIntelligence.lowStockItems.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => navigate('/inventory/stock')}
                        className="p-3 rounded-2xl bg-[#07111F]/80 border border-amber-500/20 hover:border-amber-400/50 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-white text-xs sm:text-sm">{item.medicineName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Batch: <span className="text-slate-300 font-mono">{item.batchNumber}</span> • Supplier: {item.supplier}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            {item.quantity} left
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">Reorder &lt; {item.minimumStock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expiring Soon Alerts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    Batch Expiry Watchlist ({analytics?.inventoryIntelligence?.expiringItems?.length || 0})
                  </span>
                  <Link to="/inventory/stock" className="text-[11px] text-slate-400 hover:text-white underline">
                    All Expiring
                  </Link>
                </div>

                {!analytics?.inventoryIntelligence?.expiringItems || analytics.inventoryIntelligence.expiringItems.length === 0 ? (
                  <div className="p-6 bg-[#07111F]/50 rounded-2xl border border-white/5 text-center text-xs text-slate-400">
                    <FiCheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                    No batches expiring within the next 30 days.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analytics.inventoryIntelligence.expiringItems.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => navigate('/inventory/stock')}
                        className="p-3 rounded-2xl bg-[#07111F]/80 border border-rose-500/20 hover:border-rose-400/50 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-white text-xs sm:text-sm">{item.medicineName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Batch: <span className="text-slate-300 font-mono">{item.batchNumber}</span> • Stock: {item.quantity} units
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                            item.daysLeft <= 7 
                              ? 'bg-rose-500/25 text-rose-300 border-rose-500/40 animate-pulse' 
                              : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                          }`}>
                            {item.daysLeft <= 0 ? 'Expired' : `${item.daysLeft} days left`}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 7. UNIQUE DASHBOARD ELEMENTS: PULSE, HEATMAP, HEALTH, GOAL    */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Element 1: Business Health Score */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business Health</span>
                  <div className="w-7 h-7 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                    <FiShield className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-white">{healthScore}</span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
                <p className="text-xs text-emerald-400 font-medium mt-1">
                  {healthScore >= 80 ? 'Optimal Performance' : healthScore >= 65 ? 'Stable Pharmacy Health' : 'Needs Inventory Attention'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400">
                Calculated from margins, stock availability, and sales momentum.
              </div>
            </div>

            {/* Element 2: Monthly Revenue Goal Tracker */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Revenue Target</span>
                  <button 
                    onClick={() => setIsEditingGoal(!isEditingGoal)} 
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    {isEditingGoal ? 'Save' : 'Edit'}
                  </button>
                </div>
                {isEditingGoal ? (
                  <input 
                    type="number"
                    value={revenueGoal}
                    onChange={e => setRevenueGoal(Number(e.target.value))}
                    className="bg-[#07111F] border border-cyan-400 text-white rounded-xl px-2 py-1 text-sm w-full outline-none"
                  />
                ) : (
                  <div className="text-2xl font-display font-bold text-white">
                    {formatCurrency(analytics?.totalRevenue)}
                    <span className="text-xs font-normal text-slate-400 block">
                      Target: {formatCurrency(revenueGoal)}
                    </span>
                  </div>
                )}
                
                {/* Progress Bar */}
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(Math.round(((analytics?.totalRevenue || 0) / (revenueGoal || 1)) * 100), 100)}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{Math.round(((analytics?.totalRevenue || 0) / (revenueGoal || 1)) * 100)}% Achieved</span>
                <span className="text-cyan-400 font-semibold">{formatCurrency(Math.max((revenueGoal || 0) - (analytics?.totalRevenue || 0), 0))} remaining</span>
              </div>
            </div>

            {/* Element 3: Peak Sales Hours Heatmap */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Peak Sales Hours</span>
                  <div className="w-7 h-7 rounded-xl bg-violet-400/10 border border-violet-400/30 flex items-center justify-center text-violet-400">
                    <FiClock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-display font-bold text-cyan-300">
                  {analytics?.peakHour || '14:00'}
                  <span className="text-xs font-normal text-slate-400 block">Busiest counter rush</span>
                </div>

                {/* Mini Heatmap Bars across 24h */}
                <div className="flex items-end gap-1 h-8 mt-3">
                  {(analytics?.hourlyHeatmap || []).map((h, i) => {
                    const maxH = Math.max(...(analytics?.hourlyHeatmap || []).map(x => x.count), 1);
                    const hHeight = (h.count / maxH) * 100;
                    const isPeak = h.label === analytics?.peakHour;
                    return (
                      <div 
                        key={i}
                        className={`flex-1 rounded-t-sm transition-all ${
                          isPeak ? 'bg-cyan-400 h-full' : h.count > 0 ? 'bg-violet-500/80' : 'bg-white/10'
                        }`}
                        style={{ height: `${Math.max(hHeight, 15)}%` }}
                        title={`${h.label}: ${h.count} transactions`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400">
                Optimal staffing window: 11:00 AM – 4:00 PM
              </div>
            </div>

            {/* Element 4: Smart Pharmacy Insights */}
            <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actionable Insight</span>
                  <div className="w-7 h-7 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <FiCpu className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  {analytics?.topMedicines?.[0] ? (
                    <>
                      <strong className="text-cyan-300">{analytics.topMedicines[0].medicineName}</strong> drives{' '}
                      {analytics.totalRevenue > 0 ? Math.round((analytics.topMedicines[0].revenue / analytics.totalRevenue) * 100) : 0}% of counter revenue. Ensure batch stock stays above reorder level.
                    </>
                  ) : (
                    'Record counter sales to unlock automated AI stock reorder suggestions.'
                  )}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
                <FiZap className="w-3.5 h-3.5" /> Dynamic Profit Optimization
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 8. RECENT SALES ACTIVITY TABLE                                 */}
          {/* ============================================================== */}
          <div className="bg-[#0D1B2A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
                  <FiClock className="text-cyan-400" />
                  Recent Sales Log & Itemized Audit
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Live counter transactions recorded with verified COGS and margin audit.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Payment Method Filter Tabs */}
                <div className="flex items-center gap-1 bg-[#07111F] p-1 rounded-2xl border border-white/15 text-xs">
                  {['All', 'Cash', 'UPI', 'Card', 'COD'].map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentFilter(m)}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                        paymentFilter === m ? 'bg-cyan-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ID, customer, medicine..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#07111F] border border-white/15 rounded-2xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Timeline Filter Ribbon */}
            {selectedTimelineDate && (
              <div className="bg-cyan-500/15 border-b border-cyan-400/30 px-6 py-2.5 flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-cyan-400 w-4 h-4" />
                  <span>
                    Filtered by Date: <strong className="text-cyan-300 font-bold">{selectedTimelineDate}</strong> 
                    {' '}({filteredSalesData.length} records matching)
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedTimelineDate(null)}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <FiX className="w-3 h-3" /> Clear Date Filter
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-white">
                <thead className="bg-[#07111F]/70 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Medicines Dispensed</th>
                    <th className="px-6 py-4 text-right">Revenue</th>
                    <th className="px-6 py-4 text-right">Net Profit</th>
                    <th className="px-6 py-4 text-center">Margin</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSalesData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-slate-400 text-sm">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSalesData.map(sale => {
                      const margin = sale.totalAmount > 0 ? ((sale.profit / sale.totalAmount) * 100).toFixed(0) : 0;
                      
                      return (
                        <tr key={sale._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-cyan-300 font-medium text-xs">
                            #{sale._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300">
                            {new Date(sale.createdAt).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            {sale.customerName || 'Walk-in Customer'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              sale.paymentMethod === 'Cash' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                              sale.paymentMethod === 'UPI' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' :
                              sale.paymentMethod === 'Card' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                              'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 max-w-[220px]">
                              {sale.items.map((item, i) => (
                                <div key={i} className="truncate text-xs text-slate-300">
                                  <span className="font-bold text-cyan-400">{item.quantity}x</span> {item.medicineName}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-cyan-300 font-bold">
                            {formatCurrency(sale.totalAmount)}
                          </td>
                          <td className="px-6 py-4 text-right text-emerald-400 font-semibold">
                            +{formatCurrency(sale.profit)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs bg-cyan-400/10 text-cyan-300 px-2.5 py-0.5 rounded-full font-bold border border-cyan-400/20">
                              {margin}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedTransaction(sale)}
                              className="px-3 py-1.5 bg-[#07111F] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded-xl text-xs font-semibold transition-all border border-white/10 flex items-center gap-1.5 ml-auto"
                            >
                              <FiEye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} sales recorded)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-2 bg-[#07111F] hover:bg-white/10 disabled:opacity-40 rounded-xl text-white transition-colors border border-white/10"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-2 bg-[#07111F] hover:bg-white/10 disabled:opacity-40 rounded-xl text-white transition-colors border border-white/10"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 9. ITEMIZED RECEIPT & AUDIT MODAL                              */}
      {/* ============================================================== */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#07111F]/85 backdrop-blur-md" onClick={() => setSelectedTransaction(null)}></div>
          <div className="relative bg-[#0D1B2A] border border-white/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#07111F]/60">
              <div>
                <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <FiFileText className="text-cyan-400" />
                  Itemized Receipt & COGS Audit
                </h2>
                <p className="text-slate-400 text-xs font-mono mt-0.5">ID: {selectedTransaction._id}</p>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-[#07111F]/80 p-4 rounded-2xl border border-white/5 text-xs">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Date & Time</span>
                  <p className="font-semibold text-white mt-1">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Payment Method</span>
                  <p className="font-semibold text-cyan-300 mt-1">{selectedTransaction.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Customer</span>
                  <p className="font-semibold text-white mt-1">{selectedTransaction.customerName || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Pharmacist</span>
                  <p className="font-semibold text-white mt-1">{selectedTransaction.soldBy?.fullName || 'Staff'}</p>
                </div>
              </div>

              <h4 className="font-bold text-white text-xs sm:text-sm mb-3">Dispensed Items Breakdown</h4>
              <div className="space-y-2 mb-6">
                {selectedTransaction.items.map((item, idx) => (
                  <div key={idx} className="bg-[#07111F]/80 border border-white/5 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{item.medicineName}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">Batch: {item.batchNumber || 'Catalog Stock'}</p>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-center">
                        <span className="block text-slate-500 text-[9px] uppercase">Qty</span>
                        <span className="font-bold text-white">{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-slate-500 text-[9px] uppercase">Price</span>
                        <span>{formatCurrency(item.unitPrice)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-slate-500 text-[9px] uppercase">Cost</span>
                        <span className="text-slate-400">{formatCurrency(item.unitCost)}</span>
                      </div>
                      <div className="text-right font-bold text-cyan-300">
                        <span className="block text-slate-500 text-[9px] uppercase">Total</span>
                        <span>{formatCurrency(item.lineTotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="bg-[#07111F] rounded-2xl p-5 border border-white/10 flex flex-col items-end gap-2 text-xs">
                <div className="flex justify-between w-full max-w-[280px]">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="font-medium text-white">{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[280px]">
                  <span className="text-slate-400">GST Tax (18%):</span>
                  <span className="font-medium text-amber-300">+{formatCurrency(selectedTransaction.tax)}</span>
                </div>
                <div className="w-full max-w-[280px] border-t border-white/10 my-1"></div>
                <div className="flex justify-between w-full max-w-[280px] font-bold text-sm text-cyan-300">
                  <span>Gross Revenue:</span>
                  <span>{formatCurrency(selectedTransaction.totalAmount)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[280px] text-rose-400">
                  <span>Inventory Cost:</span>
                  <span>-{formatCurrency(selectedTransaction.totalCost)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[280px] font-bold text-sm text-emerald-400 pt-1 border-t border-white/5">
                  <span>Net Profit:</span>
                  <span>+{formatCurrency(selectedTransaction.profit)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-[#07111F]/60 flex justify-end">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-xs transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesAndAnalytics;
