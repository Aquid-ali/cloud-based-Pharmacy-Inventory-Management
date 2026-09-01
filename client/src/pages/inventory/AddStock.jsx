import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiSearch, FiAlertCircle, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import { searchCatalogMedicines } from '../../services/medicineCatalogService';
import { createInventoryItem } from '../../services/inventoryService';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import AddStockModal from '../../components/inventory/AddStockModal';
import MedicineDetailsModal from '../../components/inventory/MedicineDetailsModal';
import useAuth from '../../hooks/useAuth';

const DEBOUNCE_MS = 350;
const PAGE_LIMIT = 20;

const CatalogPickCard = ({ medicine, onViewDetails, onAdd, justAdded }) => {
  const [imgError, setImgError] = useState(false);
  const showImage = medicine.imageUrl && !imgError;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={() => onViewDetails(medicine._id)}
        className="p-5 pb-3 flex-1 text-left"
      >
        <div className="w-full aspect-square rounded-xl bg-[#f0f7f6] flex items-center justify-center text-[#346560] mb-3 overflow-hidden">
          {showImage ? (
            <img
              src={medicine.imageUrl}
              alt={medicine.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <TbPill className="w-10 h-10 transform -rotate-45" />
          )}
        </div>
        <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 min-h-[2.5em]">
          {medicine.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{medicine.composition}</p>
        <p className="text-xs text-slate-400 mt-0.5">{medicine.manufacturer}</p>
      </button>
      <div className="px-5 pb-5">
        <button
          onClick={() => onAdd(medicine)}
          className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl transition-colors ${
            justAdded
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-[#346560] hover:bg-[#2b5450] text-white'
          }`}
        >
          {justAdded ? (
            <>
              <FiCheckCircle size={14} /> Added
            </>
          ) : (
            <>
              <FiPlus size={14} /> Add to Inventory
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const AddStock = () => {
  const { user } = useAuth();
  const pharmacy = user?.pharmacyId && typeof user.pharmacyId === 'object' ? user.pharmacyId : null;

  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [viewingMedicineId, setViewingMedicineId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState(new Set());

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchMedicines = useCallback(
    async (q, page, append) => {
      if (!pharmacy) return;
      const requestId = ++requestIdRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');

      try {
        const { data } = await searchCatalogMedicines({ q: q || undefined, page, limit: PAGE_LIMIT });
        if (requestId !== requestIdRef.current) return;
        setMedicines((prev) => (append ? [...prev, ...data.data.medicines] : data.data.medicines));
        setPagination(data.data.pagination);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err.response?.data?.message || 'Failed to load medicines. Please try again.');
        if (!append) setMedicines([]);
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pharmacy]
  );

  useEffect(() => {
    if (!pharmacy) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMedicines(query, 1, false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pharmacy]);

  const handleLoadMore = () => {
    if (!pagination) return;
    fetchMedicines(query, pagination.page + 1, true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createInventoryItem(payload);
      toast.success(`${selectedMedicine.name} added to your pharmacy inventory`);
      setRecentlyAddedIds((prev) => new Set(prev).add(selectedMedicine._id));
      setSelectedMedicine(null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        toast.error('A batch with this number already exists for this medicine in your inventory.');
      } else if (status === 403) {
        toast.error(err.response?.data?.message || 'You are not authorized to add stock.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to add stock. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasMore = pagination && pagination.page < pagination.totalPages;

  if (!pharmacy) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add Stock" description="Add medicines from the master catalog to your pharmacy inventory." />
        <EmptyState
          title="No pharmacy linked to this account"
          message="Adding stock requires an admin account associated with a pharmacy. Contact your system administrator if you believe this is a mistake."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Stock"
        description={`Search the master medicine catalog and add batches to ${pharmacy.name}.`}
      />

      <div className="relative max-w-xl">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medicines, e.g. Paracetamol, Augmentin..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm bg-white border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-[#346560]/10 focus:border-[#346560]/40"
        />
      </div>

      {pagination && !loading && !error && (
        <p className="text-xs text-slate-400">
          {pagination.total} result{pagination.total === 1 ? '' : 's'}
          {query ? ` for "${query}"` : ''}
        </p>
      )}

      {loading ? (
        <Spinner size="lg" />
      ) : error ? (
        <div className="py-16 text-center flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <FiAlertCircle size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-serif mb-1">Something went wrong</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">{error}</p>
          <button
            onClick={() => fetchMedicines(query, 1, false)}
            className="text-xs font-semibold text-white bg-[#346560] hover:bg-[#2b5450] px-4 py-2 rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      ) : medicines.length === 0 ? (
        <EmptyState
          title="No medicines found"
          message={
            query
              ? `We couldn't find any medicines matching "${query}". Try a different name, composition, or manufacturer.`
              : 'No medicines are available in the catalog right now.'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {medicines.map((m) => (
              <CatalogPickCard
                key={m._id}
                medicine={m}
                onViewDetails={setViewingMedicineId}
                onAdd={setSelectedMedicine}
                justAdded={recentlyAddedIds.has(m._id)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm font-semibold text-[#346560] border border-[#346560]/30 hover:bg-[#346560]/5 disabled:opacity-50 px-6 py-2.5 rounded-xl transition-colors"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {viewingMedicineId && (
        <MedicineDetailsModal
          medicineId={viewingMedicineId}
          onClose={() => setViewingMedicineId(null)}
          onAddToInventory={(medicine) => {
            setViewingMedicineId(null);
            setSelectedMedicine(medicine);
          }}
        />
      )}

      {selectedMedicine && (
        <AddStockModal
          medicine={selectedMedicine}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => !submitting && setSelectedMedicine(null)}
        />
      )}
    </div>
  );
};

export default AddStock;
