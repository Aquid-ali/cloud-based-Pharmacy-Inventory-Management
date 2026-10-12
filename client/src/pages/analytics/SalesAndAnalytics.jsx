import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FiBarChart2, FiTrendingUp, FiDollarSign, FiClock, FiDownload, FiSearch, 
  FiChevronLeft, FiChevronRight, FiEye, FiX, FiShoppingBag, FiPackage, FiLayers,
  FiCalendar, FiFilter, FiCheck, FiCreditCard, FiPercent, FiAward, FiActivity,
  FiArrowUpRight, FiRefreshCw, FiZap
} from 'react-icons/fi';
import { getSalesAnalytics, getSales } from '../../services/saleService';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

const getDateRange = (filter) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      return { startDate: startOfToday, endDate: null };
    case 'yesterday': {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 1);
      const end = new Date(startOfToday);
      end.setMilliseconds(-1);
      return { startDate: start, endDate: end };
    }
    case 'last7': {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: null };
    }
    case 'last30': {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: null };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: null };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
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

const SalesAndAnalytics = () => {
  const [filter, setFilter] = useState('last7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [analytics, setAnalytics] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  
  // Interactive Timeline & Bar Graph State
  const [selectedTimelineDate, setSelectedTimelineDate] = useState(null);
  const [chartMode, setChartMode] = useState('grouped'); // 'grouped' | 'stacked' | 'volume'
  const [activeBars, setActiveBars] = useState({
    revenue: true,
    cost: true,
    profit: true,
    unitsSold: true,
    transactions: true,
    tax: false,
  });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const timelineScrollRef = useRef(null);

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

      const [analyticsRes, salesRes] = await Promise.all([
        getSalesAnalytics(dates),
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
      toast.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedTimelineDate(null);
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, customStart, customEnd, pagination.page]);

  // Construct complete chronological timeline with continuous zero-padded days
  const timelineData = useMemo(() => {
    if (!analytics) return [];
    
    const trendMap = new Map();
    if (analytics.trend && Array.isArray(analytics.trend)) {
      analytics.trend.forEach(item => {
        trendMap.set(item.date, item);
      });
    }

    const now = new Date();
    const days = [];

    if (filter === 'today' || filter === 'yesterday') {
      const baseDate = filter === 'today' ? new Date(now) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const dateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;
      
      const point = trendMap.get(dateStr) || { revenue: 0, cost: 0, profit: 0, tax: 0, transactions: 0, unitsSold: 0 };
      days.push({
        date: dateStr,
        label: baseDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
        weekday: baseDate.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: baseDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        revenue: point.revenue || 0,
        cost: point.cost || 0,
        profit: point.profit || 0,
        tax: point.tax || 0,
        transactions: point.transactions || 0,
        unitsSold: point.unitsSold || 0,
      });
      return days;
    }

    let start, end;
    if (filter === 'last7') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'last30') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (filter === 'thisYear') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'custom' && customStart && customEnd) {
      start = new Date(customStart);
      end = new Date(customEnd);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const curr = new Date(start);
    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      const point = trendMap.get(key) || { revenue: 0, cost: 0, profit: 0, tax: 0, transactions: 0, unitsSold: 0 };
      
      days.push({
        date: key,
        label: `${d} ${curr.toLocaleDateString('en-US', { month: 'short' })}`,
        weekday: curr.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: curr.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
        revenue: point.revenue || 0,
        cost: point.cost || 0,
        profit: point.profit || 0,
        tax: point.tax || 0,
        transactions: point.transactions || 0,
        unitsSold: point.unitsSold || 0,
      });

      curr.setDate(curr.getDate() + 1);
    }

    return days;
  }, [analytics, filter, customStart, customEnd]);

  // Max values for proportional bar scaling
  const chartMetrics = useMemo(() => {
    if (timelineData.length === 0) return { maxMonetary: 1, maxUnits: 1, maxTrans: 1, avgDailyRev: 0, peakPoint: null };
    
    let maxMonetary = 0;
    let maxUnits = 0;
    let maxTrans = 0;
    let totalRev = 0;
    let peakPoint = null;

    timelineData.forEach(d => {
      totalRev += d.revenue;
      if (d.revenue > maxMonetary) maxMonetary = d.revenue;
      if (d.cost > maxMonetary) maxMonetary = d.cost;
      if (d.profit > maxMonetary) maxMonetary = d.profit;
      if (d.tax > maxMonetary) maxMonetary = d.tax;
      if (d.unitsSold > maxUnits) maxUnits = d.unitsSold;
      if (d.transactions > maxTrans) maxTrans = d.transactions;
      
      if (!peakPoint || d.revenue > peakPoint.revenue) {
        peakPoint = d;
      }
    });

    return {
      maxMonetary: maxMonetary > 0 ? maxMonetary : 1000,
      maxUnits: maxUnits > 0 ? maxUnits : 10,
      maxTrans: maxTrans > 0 ? maxTrans : 5,
      avgDailyRev: timelineData.length > 0 ? totalRev / timelineData.length : 0,
      peakPoint: peakPoint && peakPoint.revenue > 0 ? peakPoint : null,
    };
  }, [timelineData]);

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
              'Sold By': sale.soldBy?.fullName || 'Unknown',
              'Customer': sale.customerName || 'Walk-in Customer',
              'Payment Method': sale.paymentMethod,
              'Medicine': item.medicineName,
              'Batch': item.batchNumber || 'N/A',
              'Quantity': item.quantity,
              'Unit Price': item.unitPrice,
              'Unit Cost': item.unitCost,
              'Line Total (Revenue)': item.lineTotal,
              'Line Cost': item.lineCost,
              'Line Profit': item.lineTotal - item.lineCost,
              'GST / Tax': sale.tax || 0,
            });
          });
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Analytics exported successfully');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to export data');
    }
  };

  // Filter sales data by search, payment method, and clicked timeline date
  const filteredSalesData = salesData.filter(sale => {
    const matchesSearch = search === '' || 
      sale._id.toLowerCase().includes(search.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(search.toLowerCase())) ||
      sale.items.some(item => item.medicineName.toLowerCase().includes(search.toLowerCase()));

    const matchesPayment = paymentFilter === 'All' || sale.paymentMethod === paymentFilter;

    const matchesTimelineDate = !selectedTimelineDate || 
      sale.createdAt.slice(0, 10) === selectedTimelineDate;

    return matchesSearch && matchesPayment && matchesTimelineDate;
  });

  const toggleBar = (key) => {
    setActiveBars(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setBarPreset = (preset) => {
    if (preset === 'all') {
      setActiveBars({ revenue: true, cost: true, profit: true, unitsSold: true, transactions: true, tax: true });
    } else if (preset === 'financials') {
      setActiveBars({ revenue: true, cost: true, profit: true, unitsSold: false, transactions: false, tax: false });
    } else if (preset === 'margin') {
      setActiveBars({ revenue: true, cost: false, profit: true, unitsSold: false, transactions: false, tax: false });
    } else if (preset === 'volume') {
      setActiveBars({ revenue: false, cost: false, profit: false, unitsSold: true, transactions: true, tax: false });
    }
  };

  const scrollTimeline = (direction) => {
    if (timelineScrollRef.current) {
      const offset = direction === 'left' ? -250 : 250;
      timelineScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-brandCard/60 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accentCyan/10 border border-accentCyan/20 flex items-center justify-center text-accentCyan">
              <FiBarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">Sales & Analytics Hub</h1>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">Comprehensive real-time revenue, cost, margin timeline, and transaction insights.</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Quick Date Range Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select 
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full sm:w-auto bg-midnight/80 border border-white/15 text-white font-medium text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-accentCyan/50 outline-none transition-all cursor-pointer shadow-sm hover:border-white/30"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days (Timeline)</option>
              <option value="last30">Last 30 Days (Detailed)</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
          
          {filter === 'custom' && (
            <div className="flex items-center gap-2 bg-midnight/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white">
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
          
          <button 
            onClick={fetchDashboardData}
            title="Refresh analytics data"
            className="p-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl transition-colors border border-white/10"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-brandPrimary/20 hover:bg-brandPrimary/30 text-white rounded-xl font-medium text-sm transition-all border border-brandPrimary/30 shadow-sm"
          >
            <FiDownload className="w-4 h-4 text-accentCyan" />
            Export CSV
          </button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="flex flex-col items-center justify-center py-24 bg-brandCard border border-white/10 rounded-2xl">
          <div className="w-10 h-10 border-4 border-accentCyan border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white/70 font-medium">Crunching sales analytics and timeline metrics...</p>
          <p className="text-white/40 text-xs mt-1">Aggregating revenue, inventory costs, units sold, and margins</p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
          <FiX className="w-10 h-10 mb-2 text-rose-400" />
          <h3 className="text-lg font-bold text-white mb-1">Failed to Load Analytics</h3>
          <p className="text-rose-300/80 text-sm max-w-md">An error occurred while fetching the transaction metrics. Please check your connection and retry.</p>
          <button onClick={fetchDashboardData} className="mt-4 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors">
            Try Again
          </button>
        </div>
      ) : !analytics || analytics.totalTransactions === 0 ? (
        <div className="bg-brandCard border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/30">
            <FiBarChart2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Sales Recorded for this Period</h3>
          <p className="text-white/60 max-w-md text-sm">There are no completed counter transactions or sales in the selected date range. Try switching your filter to "Last 30 Days" or "This Month", or record a new counter sale.</p>
        </div>
      ) : (
        <>
          {/* Summary KPI Cards (6 Metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { 
                label: 'TOTAL REVENUE', 
                value: formatCurrency(analytics.totalRevenue), 
                subtext: `Avg ${formatCurrency(chartMetrics.avgDailyRev)}/day`,
                icon: FiDollarSign, 
                color: 'text-emerald-400', 
                bg: 'bg-emerald-400/10 border-emerald-400/20' 
              },
              { 
                label: 'NET PROFIT', 
                value: formatCurrency(analytics.totalProfit), 
                subtext: `${analytics.profitMargin.toFixed(1)}% profit margin`,
                badge: `${analytics.profitMargin.toFixed(1)}%`,
                icon: FiTrendingUp, 
                color: 'text-accentCyan', 
                bg: 'bg-accentCyan/10 border-accentCyan/20' 
              },
              { 
                label: 'COST OF GOODS', 
                value: formatCurrency(analytics.totalCost), 
                subtext: `${analytics.totalRevenue > 0 ? ((analytics.totalCost / analytics.totalRevenue) * 100).toFixed(0) : 0}% of revenue`,
                icon: FiLayers, 
                color: 'text-rose-400', 
                bg: 'bg-rose-400/10 border-rose-400/20' 
              },
              { 
                label: 'UNITS SOLD', 
                value: (analytics.totalUnitsSold || 0).toLocaleString(), 
                subtext: `${analytics.totalTransactions > 0 ? ((analytics.totalUnitsSold || 0) / analytics.totalTransactions).toFixed(1) : 0} units/sale`,
                icon: FiPackage, 
                color: 'text-indigo-400', 
                bg: 'bg-indigo-400/10 border-indigo-400/20' 
              },
              { 
                label: 'TRANSACTIONS', 
                value: (analytics.totalTransactions || 0).toLocaleString(), 
                subtext: `AOV: ${formatCurrency(analytics.avgOrderValue || (analytics.totalTransactions > 0 ? analytics.totalRevenue / analytics.totalTransactions : 0))}`,
                icon: FiShoppingBag, 
                color: 'text-amber-400', 
                bg: 'bg-amber-400/10 border-amber-400/20' 
              },
              { 
                label: 'GST TAX COLLECTED', 
                value: formatCurrency(analytics.totalTax || Math.round(analytics.totalRevenue * 0.18)), 
                subtext: '18% GST passthrough',
                icon: FiPercent, 
                color: 'text-purple-400', 
                bg: 'bg-purple-400/10 border-purple-400/20' 
              },
            ].map((card, i) => (
              <div 
                key={i} 
                className="bg-brandCard border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-all hover:shadow-lg group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase">{card.label}</span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${card.bg} ${card.color}`}>
                      <card.icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-display font-bold text-white group-hover:text-accentCyan transition-colors truncate">
                    {card.value}
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-white/50 flex items-center justify-between">
                  <span className="truncate">{card.subtext}</span>
                  {card.badge && (
                    <span className="text-accentCyan bg-accentCyan/15 border border-accentCyan/30 text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ============================================================== */}
          {/* ENHANCED TIMELINE & MULTI-BAR GRAPH                           */}
          {/* ============================================================== */}
          <div className="bg-brandCard border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            {/* Top Bar: Title, Timeline Summary, View Modes & Legend Toggles */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">Timeline & Multi-Bar Analytics</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accentCyan/15 text-accentCyan border border-accentCyan/25">
                    {timelineData.length} timeline points
                  </span>
                  {chartMetrics.peakPoint && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/25">
                      <FiAward className="w-3 h-3" /> Peak: {formatCurrency(chartMetrics.peakPoint.revenue)} ({chartMetrics.peakPoint.label})
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-xs mt-1">
                  Chronological day-by-day trajectory. Click any bar to drill down and filter the transaction records below.
                </p>
              </div>

              {/* Graph Mode Switcher & Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-midnight/70 p-1 rounded-xl border border-white/10 flex items-center gap-1">
                  <button
                    onClick={() => setChartMode('grouped')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      chartMode === 'grouped' ? 'bg-brandPrimary text-white shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Grouped Bars
                  </button>
                  <button
                    onClick={() => setChartMode('stacked')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      chartMode === 'stacked' ? 'bg-brandPrimary text-white shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Stacked Cost & Profit
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                  <button 
                    onClick={() => setBarPreset('all')} 
                    className="px-2 py-1 text-white/60 hover:text-white rounded hover:bg-white/5"
                    title="Display all 6 metrics in every bar cluster"
                  >
                    All 6 Bars
                  </button>
                  <button 
                    onClick={() => setBarPreset('financials')} 
                    className="px-2 py-1 text-white/60 hover:text-white rounded hover:bg-white/5"
                    title="Focus on Revenue, Cost, and Profit"
                  >
                    Financials
                  </button>
                  <button 
                    onClick={() => setBarPreset('volume')} 
                    className="px-2 py-1 text-white/60 hover:text-white rounded hover:bg-white/5"
                    title="Focus on Units Sold and Orders"
                  >
                    Volume
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Bar Toggles (Legend Pills) */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-white/5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white/40 text-[11px] uppercase tracking-wider font-semibold mr-1">Active Bars:</span>
                
                {/* Revenue Bar Toggle */}
                <button
                  onClick={() => toggleBar('revenue')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    activeBars.revenue 
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold' 
                      : 'bg-white/5 border-white/10 text-white/40 line-through'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-emerald-500 to-emerald-400"></div>
                  Revenue (₹)
                </button>

                {/* Cost Bar Toggle */}
                <button
                  onClick={() => toggleBar('cost')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    activeBars.cost 
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-semibold' 
                      : 'bg-white/5 border-white/10 text-white/40 line-through'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-rose-500 to-rose-400"></div>
                  Cost of Goods (₹)
                </button>

                {/* Profit Bar Toggle */}
                <button
                  onClick={() => toggleBar('profit')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    activeBars.profit 
                      ? 'bg-accentCyan/15 border-accentCyan/40 text-accentCyan font-semibold' 
                      : 'bg-white/5 border-white/10 text-white/40 line-through'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-cyan-500 to-accentCyan"></div>
                  Net Profit (₹)
                </button>

                {/* Units Sold Bar Toggle */}
                <button
                  onClick={() => toggleBar('unitsSold')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    activeBars.unitsSold 
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-semibold' 
                      : 'bg-white/5 border-white/10 text-white/40 line-through'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-indigo-500 to-indigo-400"></div>
                  Units Sold
                </button>

                {/* Transactions Bar Toggle */}
                <button
                  onClick={() => toggleBar('transactions')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    activeBars.transactions 
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold' 
                      : 'bg-white/5 border-white/10 text-white/40 line-through'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-amber-500 to-amber-400"></div>
                  Orders
                </button>

                {/* Tax Bar Toggle */}
                <button
                  onClick={() => toggleBar('tax')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    activeBars.tax 
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 font-semibold' 
                      : 'bg-white/5 border-white/10 text-white/40 line-through'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-purple-500 to-purple-400"></div>
                  GST Tax
                </button>
              </div>

              {/* Navigation Controls for Wide Timeline (30 days) */}
              {timelineData.length > 10 && (
                <div className="flex items-center gap-1.5 text-white/60">
                  <span className="text-[11px]">Scroll timeline:</span>
                  <button 
                    onClick={() => scrollTimeline('left')} 
                    className="p-1 hover:bg-white/10 rounded border border-white/10 text-white"
                    title="Scroll left"
                  >
                    <FiChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => scrollTimeline('right')} 
                    className="p-1 hover:bg-white/10 rounded border border-white/10 text-white"
                    title="Scroll right"
                  >
                    <FiChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Benchmark Average Indicator */}
            {chartMetrics.avgDailyRev > 0 && (
              <div className="flex items-center gap-2 mt-2 text-[11px] text-white/50">
                <div className="w-4 h-0 border-t-2 border-dashed border-emerald-400/60"></div>
                <span>Period Average Daily Revenue: <strong className="text-emerald-400">{formatCurrency(chartMetrics.avgDailyRev)}</strong></span>
                {selectedTimelineDate && (
                  <span className="ml-auto flex items-center gap-1.5 bg-accentCyan/15 text-accentCyan px-2 py-0.5 rounded-lg border border-accentCyan/30">
                    <FiCalendar className="w-3 h-3" /> Selected: {selectedTimelineDate}
                    <button onClick={() => setSelectedTimelineDate(null)} className="hover:text-white ml-1">×</button>
                  </span>
                )}
              </div>
            )}

            {/* Main Bar Chart Container with Horizontal Timeline */}
            <div className="relative mt-6 pt-6">
              {/* Horizontal Reference Grid Lines (Y-Axis Guides) */}
              <div className="absolute inset-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-white/30 w-full flex justify-end"><span className="text-[9px] -mt-3.5 text-white pr-1">{formatCurrency(chartMetrics.maxMonetary)}</span></div>
                <div className="border-b border-white/20 w-full flex justify-end"><span className="text-[9px] -mt-3.5 text-white pr-1">{formatCurrency(chartMetrics.maxMonetary * 0.75)}</span></div>
                <div className="border-b border-white/20 w-full flex justify-end"><span className="text-[9px] -mt-3.5 text-white pr-1">{formatCurrency(chartMetrics.maxMonetary * 0.5)}</span></div>
                <div className="border-b border-white/20 w-full flex justify-end"><span className="text-[9px] -mt-3.5 text-white pr-1">{formatCurrency(chartMetrics.maxMonetary * 0.25)}</span></div>
                <div className="border-b border-white/30 w-full flex justify-end"><span className="text-[9px] -mt-3.5 text-white pr-1">₹0</span></div>
              </div>

              {/* Period Average Line (Dashed) */}
              {chartMetrics.avgDailyRev > 0 && chartMetrics.maxMonetary > 0 && (
                <div 
                  className="absolute left-0 right-0 border-b-2 border-dashed border-emerald-400/40 pointer-events-none z-10"
                  style={{ bottom: `calc(40px + ${(chartMetrics.avgDailyRev / chartMetrics.maxMonetary) * 200}px)` }}
                >
                  <span className="absolute right-0 -top-4 text-[9px] font-bold text-emerald-400 bg-midnight/90 px-1.5 py-0.5 rounded border border-emerald-400/30">
                    Avg {formatCurrency(chartMetrics.avgDailyRev)}
                  </span>
                </div>
              )}

              {/* Scrollable Bar Clusters */}
              <div 
                ref={timelineScrollRef}
                className="h-[280px] flex items-end gap-2.5 overflow-x-auto pb-2 pt-10 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent relative z-10 select-none"
              >
                {timelineData.map((point, idx) => {
                  const isSelected = selectedTimelineDate === point.date;
                  const isPeak = chartMetrics.peakPoint && chartMetrics.peakPoint.date === point.date;
                  
                  // Heights
                  const revHeight = chartMetrics.maxMonetary > 0 ? (point.revenue / chartMetrics.maxMonetary) * 100 : 0;
                  const costHeight = chartMetrics.maxMonetary > 0 ? (point.cost / chartMetrics.maxMonetary) * 100 : 0;
                  const profitHeight = chartMetrics.maxMonetary > 0 ? (point.profit / chartMetrics.maxMonetary) * 100 : 0;
                  const taxHeight = chartMetrics.maxMonetary > 0 ? (point.tax / chartMetrics.maxMonetary) * 100 : 0;
                  
                  // Non-monetary scaled heights
                  const unitsHeight = chartMetrics.maxUnits > 0 ? (point.unitsSold / chartMetrics.maxUnits) * 100 : 0;
                  const transHeight = chartMetrics.maxTrans > 0 ? (point.transactions / chartMetrics.maxTrans) * 100 : 0;

                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedTimelineDate(isSelected ? null : point.date)}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className={`flex flex-col items-center flex-1 min-w-[50px] max-w-[85px] group relative cursor-pointer px-1 py-1 rounded-xl transition-all ${
                        isSelected 
                          ? 'bg-white/10 ring-2 ring-accentCyan shadow-lg' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Peak Badge */}
                      {isPeak && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-amber-400/25 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40 whitespace-nowrap shadow-lg">
                          👑 Peak
                        </div>
                      )}

                      {/* Interactive Floating Tooltip on Hover */}
                      <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 bg-midnight/95 border border-white/20 text-white text-xs p-3 rounded-xl shadow-2xl pointer-events-none whitespace-nowrap z-50 transition-opacity backdrop-blur-md">
                        <div className="flex items-center justify-between border-b border-white/15 pb-1.5 mb-2 gap-4">
                          <span className="font-bold text-accentCyan text-sm">{point.label}</span>
                          <span className="text-white/50 text-[10px]">{point.weekday}</span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between gap-4 text-emerald-400">
                            <span>Revenue:</span>
                            <span className="font-bold">{formatCurrency(point.revenue)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-rose-400">
                            <span>Cost of Goods:</span>
                            <span className="font-semibold">{formatCurrency(point.cost)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-accentCyan">
                            <span>Net Profit:</span>
                            <span className="font-bold">
                              {formatCurrency(point.profit)} 
                              <span className="text-white/50 text-[10px] ml-1">
                                ({point.revenue > 0 ? ((point.profit / point.revenue) * 100).toFixed(0) : 0}%)
                              </span>
                            </span>
                          </div>
                          {point.tax > 0 && (
                            <div className="flex justify-between gap-4 text-purple-400">
                              <span>GST Tax:</span>
                              <span>{formatCurrency(point.tax)}</span>
                            </div>
                          )}
                          <div className="border-t border-white/10 pt-1 mt-1 flex justify-between gap-4 text-indigo-300">
                            <span>Units Sold:</span>
                            <span className="font-bold">{point.unitsSold} units</span>
                          </div>
                          <div className="flex justify-between gap-4 text-amber-300">
                            <span>Transactions:</span>
                            <span className="font-bold">{point.transactions} sales</span>
                          </div>
                          {point.transactions > 0 && (
                            <div className="flex justify-between gap-4 text-white/50 text-[10px]">
                              <span>Avg Basket Size:</span>
                              <span>{formatCurrency(point.revenue / point.transactions)}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 pt-1 border-t border-white/10 text-[9px] text-accentCyan/80 italic text-center">
                          Click to filter table below
                        </div>
                      </div>

                      {/* Bar Clusters Rendering Area */}
                      <div className="w-full flex justify-center items-end h-[200px] gap-1 px-0.5">
                        {chartMode === 'grouped' ? (
                          <>
                            {/* Bar 1: Revenue (Emerald) */}
                            {activeBars.revenue && (
                              <div 
                                className="w-full max-w-[8px] bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 rounded-t-sm transition-all duration-300 hover:brightness-125 shadow-sm"
                                style={{ height: `${Math.max(revHeight > 0 ? revHeight : 0, point.revenue > 0 ? 4 : 1)}%` }}
                                title={`Revenue: ${formatCurrency(point.revenue)}`}
                              />
                            )}

                            {/* Bar 2: Cost of Goods (Rose) */}
                            {activeBars.cost && (
                              <div 
                                className="w-full max-w-[8px] bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400 rounded-t-sm transition-all duration-300 hover:brightness-125 shadow-sm"
                                style={{ height: `${Math.max(costHeight > 0 ? costHeight : 0, point.cost > 0 ? 4 : 1)}%` }}
                                title={`Cost: ${formatCurrency(point.cost)}`}
                              />
                            )}

                            {/* Bar 3: Net Profit (Accent Cyan) */}
                            {activeBars.profit && (
                              <div 
                                className="w-full max-w-[8px] bg-gradient-to-t from-cyan-600 via-cyan-500 to-accentCyan rounded-t-sm transition-all duration-300 hover:brightness-125 shadow-sm"
                                style={{ height: `${Math.max(profitHeight > 0 ? profitHeight : 0, point.profit > 0 ? 4 : 1)}%` }}
                                title={`Profit: ${formatCurrency(point.profit)}`}
                              />
                            )}

                            {/* Bar 4: Units Sold (Indigo) */}
                            {activeBars.unitsSold && (
                              <div 
                                className="w-full max-w-[8px] bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 rounded-t-sm transition-all duration-300 hover:brightness-125 shadow-sm"
                                style={{ height: `${Math.max(unitsHeight > 0 ? unitsHeight : 0, point.unitsSold > 0 ? 4 : 1)}%` }}
                                title={`Units Sold: ${point.unitsSold}`}
                              />
                            )}

                            {/* Bar 5: Transactions / Orders (Amber) */}
                            {activeBars.transactions && (
                              <div 
                                className="w-full max-w-[8px] bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 rounded-t-sm transition-all duration-300 hover:brightness-125 shadow-sm"
                                style={{ height: `${Math.max(transHeight > 0 ? transHeight : 0, point.transactions > 0 ? 4 : 1)}%` }}
                                title={`Orders: ${point.transactions}`}
                              />
                            )}

                            {/* Bar 6: Tax (Purple) */}
                            {activeBars.tax && (
                              <div 
                                className="w-full max-w-[8px] bg-gradient-to-t from-purple-600 via-purple-500 to-purple-400 rounded-t-sm transition-all duration-300 hover:brightness-125 shadow-sm"
                                style={{ height: `${Math.max(taxHeight > 0 ? taxHeight : 0, point.tax > 0 ? 4 : 1)}%` }}
                                title={`Tax: ${formatCurrency(point.tax)}`}
                              />
                            )}
                          </>
                        ) : (
                          /* Stacked Financials Mode: Cost + Profit stack side-by-side with Revenue & Units */
                          <div className="w-full flex items-end justify-center gap-1.5 h-full">
                            {/* Stacked Pillar: Cost at bottom, Profit on top */}
                            <div className="w-3.5 flex flex-col justify-end h-full">
                              {point.profit > 0 && (
                                <div 
                                  className="w-full bg-accentCyan rounded-t-sm transition-all shadow-sm"
                                  style={{ height: `${profitHeight}%` }}
                                  title={`Profit: ${formatCurrency(point.profit)}`}
                                />
                              )}
                              {point.cost > 0 && (
                                <div 
                                  className="w-full bg-rose-500/90 rounded-b-sm transition-all shadow-sm"
                                  style={{ height: `${costHeight}%` }}
                                  title={`Cost: ${formatCurrency(point.cost)}`}
                                />
                              )}
                              {point.revenue === 0 && (
                                <div className="w-full h-[2px] bg-white/20" />
                              )}
                            </div>

                            {/* Revenue Pillar */}
                            <div 
                              className="w-3.5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all shadow-sm"
                              style={{ height: `${Math.max(revHeight, point.revenue > 0 ? 4 : 2)}%` }}
                              title={`Revenue: ${formatCurrency(point.revenue)}`}
                            />

                            {/* Units Sold Indicator */}
                            <div 
                              className="w-2.5 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm transition-all opacity-80"
                              style={{ height: `${Math.max(unitsHeight, point.unitsSold > 0 ? 4 : 2)}%` }}
                              title={`Units Sold: ${point.unitsSold}`}
                            />
                          </div>
                        )}
                      </div>

                      {/* X-Axis Timeline Label */}
                      <div className="mt-2.5 flex flex-col items-center">
                        <span className={`text-[10px] font-medium truncate w-full text-center ${
                          isSelected ? 'text-accentCyan font-bold' : 'text-white/70'
                        }`}>
                          {point.label}
                        </span>
                        <span className="text-[9px] text-white/40">{point.weekday}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline Horizontal Axis Line with Visual Ticks */}
              <div className="w-full border-t border-white/20 mt-1 flex justify-between px-2 text-[10px] text-white/40 pt-2">
                <span>Start: {timelineData[0]?.label}</span>
                <span className="text-accentCyan font-medium">
                  {timelineData.filter(d => d.revenue > 0).length} active sales days in period
                </span>
                <span>End: {timelineData[timelineData.length - 1]?.label}</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SUPPORTING ANALYTICS: PAYMENT CHANNELS & TOP MEDICINES         */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales by Payment Method Breakdown */}
            <div className="bg-brandCard border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiCreditCard className="w-4 h-4 text-accentCyan" />
                    <h3 className="text-white font-bold text-base">Payment Methods</h3>
                  </div>
                  <span className="text-xs text-white/50">{analytics.paymentMethods?.length || 0} channels</span>
                </div>

                {!analytics.paymentMethods || analytics.paymentMethods.length === 0 ? (
                  <p className="text-white/40 text-sm py-8 text-center">No payment data recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {analytics.paymentMethods.map((pm, idx) => {
                      const colors = {
                        Cash: { bg: 'bg-emerald-500', text: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-400' },
                        UPI: { bg: 'bg-accentCyan', text: 'text-accentCyan', bar: 'from-cyan-500 to-accentCyan' },
                        Card: { bg: 'bg-indigo-500', text: 'text-indigo-400', bar: 'from-indigo-500 to-indigo-400' },
                        COD: { bg: 'bg-amber-500', text: 'text-amber-400', bar: 'from-amber-500 to-amber-400' },
                      };
                      const c = colors[pm.method] || { bg: 'bg-white', text: 'text-white', bar: 'from-white/60 to-white' };

                      return (
                        <div 
                          key={idx}
                          onClick={() => setPaymentFilter(paymentFilter === pm.method ? 'All' : pm.method)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            paymentFilter === pm.method 
                              ? 'bg-white/10 border-accentCyan shadow' 
                              : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-white flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${c.bg}`}></span>
                              {pm.method}
                            </span>
                            <span className={`text-sm font-bold ${c.text}`}>
                              {formatCurrency(pm.revenue)}
                            </span>
                          </div>
                          
                          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(pm.percentage, 5)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-1 text-[11px] text-white/50">
                            <span>{pm.count} transactions</span>
                            <span>{pm.percentage}% of revenue</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Performance Highlights Summary */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase">Daily Average</span>
                    <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
                      {formatCurrency(chartMetrics.avgDailyRev)}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase">Peak Day</span>
                    <span className="text-amber-400 font-bold text-sm mt-0.5 block truncate">
                      {chartMetrics.peakPoint ? formatCurrency(chartMetrics.peakPoint.revenue) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Selling Medicines */}
            <div className="lg:col-span-2 bg-brandCard border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiPackage className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-white font-bold text-base">Top Selling Medicines (By Volume & Revenue)</h3>
                  </div>
                  <span className="text-xs text-white/50">{analytics.topMedicines?.length || 0} products</span>
                </div>

                {analytics.topMedicines.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-12 text-white/40 text-sm">
                    No medicine sales data in this date range.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.topMedicines.slice(0, 6).map((med, idx) => {
                      const maxMedRev = Math.max(...analytics.topMedicines.map(m => m.revenue));
                      const widthPercent = maxMedRev > 0 ? (med.revenue / maxMedRev) * 100 : 0;
                      
                      const rankBadges = [
                        'bg-amber-400/20 text-amber-300 border-amber-400/40',
                        'bg-slate-300/20 text-slate-200 border-slate-300/40',
                        'bg-amber-700/20 text-amber-400 border-amber-700/40',
                      ];
                      const badgeClass = rankBadges[idx] || 'bg-white/10 text-white/60 border-white/15';

                      return (
                        <div 
                          key={idx} 
                          className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${badgeClass}`}>
                                #{idx + 1}
                              </span>
                              <p className="text-white font-medium text-sm truncate">{med.medicineName}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-emerald-400 font-bold text-sm">{formatCurrency(med.revenue)}</span>
                              <span className="text-accentCyan text-xs ml-2 font-medium">+{formatCurrency(med.profit)} profit</span>
                            </div>
                          </div>

                          {/* Contribution bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-accentCyan rounded-full transition-all"
                                style={{ width: `${Math.max(widthPercent, 8)}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/60 shrink-0 font-medium">{med.quantitySold} units dispensed</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Insight Banner */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <FiZap className="text-amber-400" />
                  Inventory Insights: Tracking direct COGS against selling price per batch.
                </span>
                <span className="text-accentCyan font-medium">
                  {analytics.totalUnitsSold || 0} Total Units Dispensed
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RECENT SALES TRANSACTIONS LOG                                  */}
          {/* ============================================================== */}
          <div className="bg-brandCard border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="p-5 border-b border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <FiClock className="text-accentCyan" />
                  Transaction Log & Itemized Receipts
                </h3>
                <p className="text-white/50 text-xs mt-0.5">
                  Live counter sales audited with line costs and margin calculations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Payment Filter Tabs */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                  {['All', 'Cash', 'UPI', 'Card', 'COD'].map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentFilter(m)}
                      className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                        paymentFilter === m ? 'bg-accentCyan text-brandDark font-bold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search ID, customer, medicine..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accentCyan/50"
                  />
                </div>
              </div>
            </div>

            {/* Timeline Filter Active Banner */}
            {selectedTimelineDate && (
              <div className="bg-accentCyan/15 border-b border-accentCyan/30 px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm text-white">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-accentCyan w-4 h-4" />
                  <span>
                    Filtered by timeline date: <strong className="text-accentCyan font-bold">{selectedTimelineDate}</strong> 
                    {' '}({filteredSalesData.length} records matching)
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedTimelineDate(null)}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <FiX className="w-3 h-3" /> Clear Timeline Filter
                </button>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-white/5 text-white/50 font-medium text-xs uppercase tracking-wider">
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
                <tbody className="divide-y divide-white/10">
                  {filteredSalesData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-white/40">
                        No transactions found matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSalesData.map(sale => {
                      const margin = sale.totalAmount > 0 ? ((sale.profit / sale.totalAmount) * 100).toFixed(0) : 0;
                      
                      return (
                        <tr key={sale._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-white/80 text-xs">
                            #{sale._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-white/70">
                            {new Date(sale.createdAt).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 text-white/90 font-medium">
                            {sale.customerName || 'Walk-in Customer'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              sale.paymentMethod === 'Cash' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                              sale.paymentMethod === 'UPI' ? 'bg-cyan-500/15 text-accentCyan border-cyan-500/30' :
                              sale.paymentMethod === 'Card' ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' :
                              'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 max-w-[220px]">
                              {sale.items.map((item, i) => (
                                <div key={i} className="truncate text-xs text-white/80">
                                  <span className="font-bold text-accentCyan">{item.quantity}x</span> {item.medicineName}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-emerald-400 font-bold">
                            {formatCurrency(sale.totalAmount)}
                          </td>
                          <td className="px-6 py-4 text-right text-accentCyan font-semibold">
                            {formatCurrency(sale.profit)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs bg-accentCyan/10 text-accentCyan px-2 py-0.5 rounded-full font-semibold border border-accentCyan/20">
                              {margin}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedTransaction(sale)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white rounded-lg text-xs font-medium transition-colors border border-white/10 flex items-center gap-1.5 ml-auto"
                              title="View receipt breakdown"
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/50">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} sales)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 rounded-lg text-white transition-colors"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 rounded-lg text-white transition-colors"
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
      {/* ITEMIZED RECEIPT & TRANSACTION DETAILS MODAL                   */}
      {/* ============================================================== */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" onClick={() => setSelectedTransaction(null)}></div>
          <div className="relative bg-brandCard border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div>
                <h2 className="text-xl font-display font-bold text-white">Itemized Receipt & Audit</h2>
                <p className="text-white/50 text-xs font-mono mt-0.5">Transaction ID: {selectedTransaction._id}</p>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-white/5 p-4 rounded-xl border border-white/5 text-xs">
                <div>
                  <span className="text-white/40 uppercase tracking-wider block text-[10px]">Date & Time</span>
                  <p className="font-semibold text-white mt-1">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-white/40 uppercase tracking-wider block text-[10px]">Payment Method</span>
                  <p className="font-semibold text-accentCyan mt-1">{selectedTransaction.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-white/40 uppercase tracking-wider block text-[10px]">Customer</span>
                  <p className="font-semibold text-white mt-1">{selectedTransaction.customerName || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <span className="text-white/40 uppercase tracking-wider block text-[10px]">Pharmacist</span>
                  <p className="font-semibold text-white mt-1">{selectedTransaction.soldBy?.fullName || 'Staff'}</p>
                </div>
              </div>

              <h4 className="font-bold text-white text-sm mb-3">Dispensed Items Breakdown</h4>
              <div className="space-y-2.5 mb-6">
                {selectedTransaction.items.map((item, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{item.medicineName}</p>
                      <p className="text-white/50 mt-0.5">Batch: {item.batchNumber || 'Standard Stock'}</p>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-center">
                        <span className="block text-white/40 text-[9px] uppercase">Qty</span>
                        <span className="font-bold text-white">{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-white/40 text-[9px] uppercase">Price</span>
                        <span>{formatCurrency(item.unitPrice)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-white/40 text-[9px] uppercase">Cost</span>
                        <span className="text-white/60">{formatCurrency(item.unitCost)}</span>
                      </div>
                      <div className="text-right font-bold text-emerald-400">
                        <span className="block text-white/40 text-[9px] uppercase">Line Total</span>
                        <span>{formatCurrency(item.lineTotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="bg-midnight/70 rounded-xl p-5 border border-white/10 flex flex-col items-end gap-2 text-xs">
                <div className="flex justify-between w-full max-w-[280px]">
                  <span className="text-white/60">Gross Subtotal:</span>
                  <span className="font-medium">{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[280px]">
                  <span className="text-white/60">GST Tax (18%):</span>
                  <span className="font-medium text-purple-300">+{formatCurrency(selectedTransaction.tax)}</span>
                </div>
                <div className="w-full max-w-[280px] border-t border-white/10 my-1"></div>
                <div className="flex justify-between w-full max-w-[280px] font-bold text-base text-emerald-400">
                  <span>Total Revenue:</span>
                  <span>{formatCurrency(selectedTransaction.totalAmount)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[280px] text-rose-400">
                  <span>Total Cost (COGS):</span>
                  <span>-{formatCurrency(selectedTransaction.totalCost)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[280px] font-bold text-sm text-accentCyan pt-1 border-t border-white/5">
                  <span>Net Profit:</span>
                  <span>{formatCurrency(selectedTransaction.profit)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[280px] pt-1">
                  <span className="text-white/40">Profit Margin:</span>
                  <span className="text-accentCyan bg-accentCyan/15 border border-accentCyan/30 px-2 py-0.5 rounded-full font-bold">
                    {selectedTransaction.totalAmount > 0 ? ((selectedTransaction.profit / selectedTransaction.totalAmount) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesAndAnalytics;
