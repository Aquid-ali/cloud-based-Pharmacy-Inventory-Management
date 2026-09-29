import React, { useState, useEffect } from 'react';
import { 
  FiBarChart2, FiTrendingUp, FiDollarSign, FiClock, FiDownload, FiSearch, 
  FiChevronLeft, FiChevronRight, FiEye, FiX, FiShoppingBag, FiPackage, FiLayers 
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
      start.setDate(start.getDate() - 6); // 6 full days before today + today = 7 days
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
  }).format(amount);
};

const SalesAndAnalytics = () => {
  const [filter, setFilter] = useState('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [analytics, setAnalytics] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, customStart, customEnd, pagination.page]);

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
              'Customer': sale.customerName || 'Walk-in',
              'Payment Method': sale.paymentMethod,
              'Medicine': item.medicineName,
              'Batch': item.batchNumber || 'N/A',
              'Quantity': item.quantity,
              'Unit Price': item.unitPrice,
              'Unit Cost': item.unitCost,
              'Line Total (Revenue)': item.lineTotal,
              'Line Cost': item.lineCost,
              'Profit': item.lineTotal - item.lineCost,
            });
          });
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_export_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to export data');
    }
  };

  const filteredSalesData = salesData.filter(sale => 
    search === '' || 
    sale._id.toLowerCase().includes(search.toLowerCase()) ||
    sale.items.some(item => item.medicineName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Sales & Analytics</h1>
          <p className="text-white/60 text-sm mt-1">Track your pharmacy's real sales, revenue, costs, and profits.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="bg-brandDark/50 border border-white/10 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-accentCyan/50 outline-none"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {filter === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-brandDark/50 border border-white/10 text-white rounded-xl px-3 py-2 text-sm"
              />
              <span className="text-white/50">-</span>
              <input 
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-brandDark/50 border border-white/10 text-white rounded-xl px-3 py-2 text-sm"
              />
            </div>
          )}
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10"
          >
            <FiDownload />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-brandCard border border-white/10 rounded-2xl">
          <div className="w-8 h-8 border-4 border-accentCyan border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white/60">Loading sales analytics...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl flex flex-col items-center justify-center">
          <FiX className="w-8 h-8 mb-2" />
          <p>Unable to load sales data. Please try again.</p>
          <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors">
            Retry
          </button>
        </div>
      ) : !analytics || analytics.totalTransactions === 0 ? (
        <div className="bg-brandCard border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/40">
            <FiBarChart2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No sales recorded yet.</h3>
          <p className="text-white/60 max-w-md">There are no completed sales transactions in the selected date range. Try adjusting your filters or record a new sale.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'TOTAL SALES', value: analytics.totalTransactions, icon: FiShoppingBag, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: 'UNITS SOLD', value: analytics.totalUnitsSold, icon: FiPackage, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
              { label: 'REVENUE', value: formatCurrency(analytics.totalRevenue), icon: FiDollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { label: 'COST OF GOODS', value: formatCurrency(analytics.totalCost), icon: FiLayers, color: 'text-rose-400', bg: 'bg-rose-400/10' },
              { label: 'NET PROFIT', value: formatCurrency(analytics.totalProfit), icon: FiTrendingUp, color: 'text-accentCyan', bg: 'bg-accentCyan/10' },
            ].map((card, i) => (
              <div key={i} className="bg-brandCard border border-white/10 rounded-2xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-white/50 tracking-wider">{card.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg} ${card.color}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-display font-bold text-white">
                  {card.value}
                </div>
                {card.label === 'NET PROFIT' && (
                  <div className="mt-2 text-sm">
                    <span className="text-accentCyan font-medium">{analytics.profitMargin.toFixed(1)}%</span>
                    <span className="text-white/40 ml-1.5">Profit Margin</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart (CSS based to avoid new dependency) */}
            <div className="lg:col-span-2 bg-brandCard border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-6">Sales & Profit Trend</h3>
              {analytics.trend.length === 0 ? (
                <div className="flex items-center justify-center h-[250px] text-white/40">No trend data available.</div>
              ) : (
                <div className="h-[250px] flex items-end gap-2 overflow-x-auto pb-6">
                  {analytics.trend.map((point, idx) => {
                    const maxVal = Math.max(...analytics.trend.map(t => t.revenue));
                    const revHeight = maxVal > 0 ? (point.revenue / maxVal) * 100 : 0;
                    const costHeight = maxVal > 0 ? (point.cost / maxVal) * 100 : 0;
                    const profitHeight = maxVal > 0 ? (point.profit / maxVal) * 100 : 0;
                    
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 min-w-[40px] group relative">
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-midnight text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10 transition-opacity">
                          <p className="font-bold border-b border-white/10 pb-1 mb-1">{point.date}</p>
                          <p className="text-emerald-400">Rev: {formatCurrency(point.revenue)}</p>
                          <p className="text-rose-400">Cost: {formatCurrency(point.cost)}</p>
                          <p className="text-accentCyan">Profit: {formatCurrency(point.profit)}</p>
                        </div>
                        <div className="w-full flex justify-center items-end h-[200px] gap-0.5">
                          <div className="w-1/3 bg-emerald-400/80 rounded-t-sm" style={{ height: `${revHeight}%` }}></div>
                          <div className="w-1/3 bg-rose-400/80 rounded-t-sm" style={{ height: `${costHeight}%` }}></div>
                          <div className="w-1/3 bg-accentCyan/80 rounded-t-sm" style={{ height: `${profitHeight}%` }}></div>
                        </div>
                        <span className="text-[10px] text-white/40 mt-3 truncate w-full text-center">{point.date.slice(-5)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center justify-center gap-6 mt-2 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400/80"></div><span className="text-xs text-white/60">Revenue</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-400/80"></div><span className="text-xs text-white/60">Cost</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accentCyan/80"></div><span className="text-xs text-white/60">Profit</span></div>
              </div>
            </div>

            {/* Top Selling Medicines */}
            <div className="bg-brandCard border border-white/10 rounded-2xl p-6 flex flex-col">
              <h3 className="text-white font-bold mb-4">Top Selling Medicines</h3>
              {analytics.topMedicines.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-white/40">No medicines sold yet.</div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {analytics.topMedicines.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate pr-3">{med.medicineName}</p>
                        <p className="text-xs text-white/50">{med.quantitySold} units sold</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-emerald-400 font-medium text-sm">{formatCurrency(med.revenue)}</p>
                        <p className="text-accentCyan text-xs">{formatCurrency(med.profit)} profit</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales History */}
          <div className="bg-brandCard border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-white font-bold">Recent Sales</h3>
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search transactions or medicines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accentCyan/50"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-white/5 text-white/50 font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Medicines</th>
                    <th className="px-6 py-4 text-right">Revenue</th>
                    <th className="px-6 py-4 text-right">Profit</th>
                    <th className="px-6 py-4">Sold By</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredSalesData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-white/40">
                        No sales found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    filteredSalesData.map(sale => (
                      <tr key={sale._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-white/70">
                          {sale._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(sale.createdAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 max-w-[200px]">
                            {sale.items.map((item, i) => (
                              <div key={i} className="truncate text-white/80">
                                {item.quantity}x {item.medicineName}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right text-accentCyan">
                          {formatCurrency(sale.profit)}
                        </td>
                        <td className="px-6 py-4 text-white/70">
                          {sale.soldBy?.fullName || 'System'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedTransaction(sale)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                          >
                            <FiEye />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm text-white/50">
                  Showing page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-lg text-white transition-colors"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-lg text-white transition-colors"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" onClick={() => setSelectedTransaction(null)}></div>
          <div className="relative bg-brandCard border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div>
                <h2 className="text-xl font-display font-bold text-white">Transaction Details</h2>
                <p className="text-white/50 text-sm font-mono mt-1">ID: {selectedTransaction._id}</p>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <FiX />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">Date</span>
                  <p className="font-medium mt-1">{new Date(selectedTransaction.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">Payment</span>
                  <p className="font-medium mt-1">{selectedTransaction.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">Customer</span>
                  <p className="font-medium mt-1">{selectedTransaction.customerName || 'Walk-in'}</p>
                </div>
                <div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">Sold By</span>
                  <p className="font-medium mt-1">{selectedTransaction.soldBy?.fullName || 'System'}</p>
                </div>
              </div>

              <h4 className="font-bold text-white/80 mb-3 border-b border-white/10 pb-2">Items</h4>
              <div className="space-y-3 mb-8">
                {selectedTransaction.items.map((item, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-white">{item.medicineName}</p>
                      <p className="text-xs text-white/50 mt-1">Batch: {item.batchNumber || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <span className="block text-white/40 text-[10px] uppercase">Qty</span>
                        <span>{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-white/40 text-[10px] uppercase">Price</span>
                        <span>{formatCurrency(item.unitPrice)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-white/40 text-[10px] uppercase">Cost</span>
                        <span className="text-white/60">{formatCurrency(item.unitCost)}</span>
                      </div>
                      <div className="text-right font-medium">
                        <span className="block text-white/40 text-[10px] uppercase">Total</span>
                        <span>{formatCurrency(item.lineTotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-brandDark/50 rounded-xl p-5 border border-white/5 flex flex-col items-end gap-2 text-sm">
                <div className="flex justify-between w-full max-w-[250px]">
                  <span className="text-white/60">Subtotal:</span>
                  <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[250px]">
                  <span className="text-white/60">Tax (GST):</span>
                  <span>{formatCurrency(selectedTransaction.tax)}</span>
                </div>
                <div className="w-full max-w-[250px] border-t border-white/10 my-1"></div>
                <div className="flex justify-between w-full max-w-[250px] font-bold text-lg text-emerald-400">
                  <span>Total Revenue:</span>
                  <span>{formatCurrency(selectedTransaction.totalAmount)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[250px] text-rose-400 mt-2">
                  <span>Total Cost:</span>
                  <span>{formatCurrency(selectedTransaction.totalCost)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[250px] font-bold text-accentCyan text-base">
                  <span>Net Profit:</span>
                  <span>{formatCurrency(selectedTransaction.profit)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[250px] text-xs mt-1">
                  <span className="text-white/40">Profit Margin:</span>
                  <span className="text-accentCyan bg-accentCyan/10 px-2 py-0.5 rounded-full">
                    {selectedTransaction.totalAmount > 0 ? ((selectedTransaction.profit / selectedTransaction.totalAmount) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesAndAnalytics;
