import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiAlertCircle } from 'react-icons/fi';
import { searchCatalogMedicines } from '../../services/medicineCatalogService';
import MedicineCatalogCard from '../../components/customer/MedicineCatalogCard';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import { SkeletonCardGrid } from '../../components/Skeleton';

const DEBOUNCE_MS = 350;
const PAGE_LIMIT = 20;

const MedicineSearch = () => {
  // Supports deep-linking with ?q= (e.g. from the landing page's category
  // cards / hero search) - only read once on mount, the input then owns it.
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchMedicines = useCallback(async (q, page, append) => {
    const requestId = ++requestIdRef.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      const { data } = await searchCatalogMedicines({ q: q || undefined, page, limit: PAGE_LIMIT });
      if (requestId !== requestIdRef.current) return; // a newer request has superseded this one
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
  }, []);

  // Search-as-you-type, debounced
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMedicines(query, 1, false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleLoadMore = () => {
    if (!pagination) return;
    fetchMedicines(query, pagination.page + 1, true);
  };

  const hasMore = pagination && pagination.page < pagination.totalPages;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-serif text-ink">Medicine Search</h1>
        <p className="text-xs text-ink-faint mt-1">
          Search our full medicine catalog by name, composition, or manufacturer.
        </p>
      </div>

      <FormField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search medicines, e.g. Paracetamol, Augmentin..."
        icon={FiSearch}
        className="max-w-xl"
      />

      {pagination && !loading && !error && (
        <p className="text-xs text-ink-faint">
          {pagination.total} result{pagination.total === 1 ? '' : 's'}
          {query ? ` for "${query}"` : ''}
        </p>
      )}

      {loading ? (
        <SkeletonCardGrid count={12} />
      ) : error ? (
        <div className="py-16 text-center flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <FiAlertCircle size={32} />
          </div>
          <h3 className="text-base font-bold text-ink font-serif mb-1">We couldn't load your medicines</h3>
          <p className="text-xs text-ink-faint max-w-sm leading-relaxed mb-4">{error}</p>
          <Button size="sm" onClick={() => fetchMedicines(query, 1, false)}>
            Try again
          </Button>
        </div>
      ) : medicines.length === 0 ? (
        <EmptyState
          title="Nothing matched that search"
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
              <MedicineCatalogCard key={m._id} medicine={m} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" size="md" loading={loadingMore} onClick={handleLoadMore}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MedicineSearch;
