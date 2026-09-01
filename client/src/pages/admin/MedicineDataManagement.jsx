import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiDatabase, FiCheckCircle, FiClock, FiLoader, FiXCircle, FiAlertTriangle,
  FiZap, FiRefreshCw, FiSearch, FiEye,
} from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';
import { getCatalogMedicines } from '../../services/medicineCatalogService';
import {
  enrichMedicine, enrichAllMedicines, retryFailedMedicines, getEnrichmentStats,
} from '../../services/medicineEnrichmentService';

const STATUS_META = {
  completed: { label: 'Completed', icon: FiCheckCircle, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  processing: { label: 'Processing', icon: FiLoader, className: 'bg-blue-50 text-blue-700 border-blue-200', spin: true },
  pending: { label: 'Pending', icon: FiClock, className: 'bg-slate-100 text-slate-600 border-slate-200' },
  failed: { label: 'Failed', icon: FiXCircle, className: 'bg-rose-50 text-rose-700 border-rose-200' },
  needs_review: { label: 'Needs Review', icon: FiAlertTriangle, className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.className}`}>
      <Icon size={12} className={meta.spin ? 'animate-spin' : ''} /> {meta.label}
    </span>
  );
};

const DEBOUNCE_MS = 350;
const PAGE_LIMIT = 20;

const MedicineDataManagement = () => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [rowBusyId, setRowBusyId] = useState(null);

  const debounceRef = useRef(null);
  const pollRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await getEnrichmentStats();
      setStats(data.data);
    } catch {
      // Silently keep the last known stats on a transient polling failure.
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchMedicines = useCallback(async (q, pageNum) => {
    setListLoading(true);
    try {
      const { data } = await getCatalogMedicines({ search: q || undefined, page: pageNum, limit: PAGE_LIMIT });
      setMedicines(data.data.medicines);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Failed to load medicines');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Adaptive polling: fast while something is actively processing, slow otherwise.
  useEffect(() => {
    const isActive = stats?.processing > 0 || stats?.bulkRun?.running;
    const interval = isActive ? 3000 : 12000;
    pollRef.current = setInterval(fetchStats, interval);
    return () => clearInterval(pollRef.current);
  }, [stats?.processing, stats?.bulkRun?.running, fetchStats]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchMedicines(query, 1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    fetchMedicines(query, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleEnrichAll = async () => {
    setBulkBusy(true);
    try {
      const { data } = await enrichAllMedicines();
      toast.success(data.message);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start enrichment');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleRetryFailed = async () => {
    setBulkBusy(true);
    try {
      const { data } = await retryFailedMedicines();
      toast.success(data.message);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start retry');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleRowEnrich = async (medicine, force) => {
    setRowBusyId(medicine._id);
    try {
      const { data } = await enrichMedicine(medicine._id, force);
      toast.success(data.message);
      setMedicines((prev) => prev.map((m) => (m._id === medicine._id ? data.data.medicine : m)));
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enrich medicine');
    } finally {
      setRowBusyId(null);
    }
  };

  const progressPct = stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const isBulkRunning = Boolean(stats?.bulkRun?.running);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicine Data Management"
        description="AI-powered enrichment of centralized medicine information, shared across every pharmacy."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleEnrichAll}
              disabled={bulkBusy || isBulkRunning}
              className="flex items-center gap-2 bg-[#4ecdc4] text-[#1c3734] font-semibold text-sm px-4 py-2.5 rounded-2xl hover:bg-[#3dbdb5] transition-colors disabled:opacity-50"
            >
              <FiZap size={15} /> {isBulkRunning ? 'Enriching…' : 'Enrich All Medicines'}
            </button>
            <button
              onClick={handleRetryFailed}
              disabled={bulkBusy || isBulkRunning || !stats?.failed}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-4 py-2.5 rounded-2xl border border-white/10 transition-colors disabled:opacity-40"
            >
              <FiRefreshCw size={15} /> Retry Failed
            </button>
            <Link
              to="/medicine-data/review"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-4 py-2.5 rounded-2xl border border-white/10 transition-colors"
            >
              <FiEye size={15} /> Review Medicines {stats?.needs_review ? `(${stats.needs_review})` : ''}
            </Link>
          </div>
        }
      />

      {statsLoading ? (
        <Spinner size="lg" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={FiDatabase} label="Total Medicines" value={stats?.total ?? 0} bgTint="bg-[#346560]/10" iconColor="text-[#346560]" borderColor="border-[#346560]/20" />
            <StatCard icon={FiCheckCircle} label="Completed" value={stats?.completed ?? 0} bgTint="bg-emerald-500/10" iconColor="text-emerald-600" borderColor="border-emerald-500/20" />
            <StatCard icon={FiClock} label="Pending" value={stats?.pending ?? 0} bgTint="bg-slate-500/10" iconColor="text-slate-600" borderColor="border-slate-500/20" />
            <StatCard icon={FiLoader} label="Processing" value={stats?.processing ?? 0} bgTint="bg-blue-500/10" iconColor="text-blue-600" borderColor="border-blue-500/20" />
            <StatCard icon={FiXCircle} label="Failed" value={stats?.failed ?? 0} bgTint="bg-rose-500/10" iconColor="text-rose-600" borderColor="border-rose-500/20" />
            <StatCard icon={FiAlertTriangle} label="Needs Review" value={stats?.needs_review ?? 0} bgTint="bg-amber-500/10" iconColor="text-amber-600" borderColor="border-amber-500/20" />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Enrichment Progress</span>
              <span className="text-sm font-bold text-slate-900">{progressPct}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#346560] transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            {isBulkRunning && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <FiLoader className="animate-spin" size={12} />
                Bulk enrichment in progress: {stats.bulkRun.processed} / {stats.bulkRun.total} processed
              </p>
            )}
            {!stats?.aiConfigured && (
              <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
                <FiAlertTriangle size={12} /> AI provider not configured — set ANTHROPIC_API_KEY on the server to enable enrichment.
              </p>
            )}
          </div>
        </>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
        <div className="relative mb-4 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicines..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]"
          />
        </div>

        {listLoading ? (
          <Spinner size="lg" />
        ) : medicines.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No medicines found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 pr-4">Medicine Name</th>
                  <th className="py-3 pr-4">Generic Name</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Confidence</th>
                  <th className="py-3 pr-4">Last Enriched</th>
                  <th className="py-3 pr-4">Source</th>
                  <th className="py-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m) => (
                  <tr key={m._id}>
                    <td className="py-3 pr-4 font-medium text-slate-800">{m.name}</td>
                    <td className="py-3 pr-4 text-slate-500">{m.genericName || '—'}</td>
                    <td className="py-3 pr-4"><StatusBadge status={m.enrichmentStatus || 'pending'} /></td>
                    <td className="py-3 pr-4 text-slate-500">{m.enrichmentConfidence ? `${m.enrichmentConfidence}%` : '—'}</td>
                    <td className="py-3 pr-4 text-slate-500">{m.lastEnrichedAt ? new Date(m.lastEnrichedAt).toLocaleDateString() : '—'}</td>
                    <td className="py-3 pr-4 text-slate-500 truncate max-w-[10rem]">{m.informationSource || '—'}</td>
                    <td className="py-3 pr-4 text-right">
                      {m.enrichmentStatus === 'completed' ? (
                        <button
                          onClick={() => handleRowEnrich(m, true)}
                          disabled={rowBusyId === m._id}
                          className="text-xs font-semibold text-[#346560] hover:text-[#2b5450] disabled:opacity-50"
                        >
                          {rowBusyId === m._id ? 'Refreshing…' : 'Refresh Information'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRowEnrich(m, false)}
                          disabled={rowBusyId === m._id}
                          className="text-xs font-semibold text-white bg-[#346560] hover:bg-[#2b5450] px-3 py-1.5 rounded-xl disabled:opacity-50"
                        >
                          {rowBusyId === m._id ? 'Enriching…' : m.enrichmentStatus === 'failed' ? 'Retry' : 'Enrich'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 text-sm">
            <span className="text-slate-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} medicines)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineDataManagement;
