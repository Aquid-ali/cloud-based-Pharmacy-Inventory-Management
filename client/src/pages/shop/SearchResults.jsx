import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiMapPin } from 'react-icons/fi';
import { browsePharmacyInventory } from '../../services/pharmacyService';
import PharmacyMedicineCard from '../../components/shop/PharmacyMedicineCard';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import { SkeletonCardGrid } from '../../components/Skeleton';
import useCart from '../../hooks/useCart';

const PAGE_LIMIT = 40;

const SearchResults = () => {
  const { pharmacyId, pharmacyName } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // A new search term or pharmacy always starts back at page 1.
  useEffect(() => {
    setPage(1);
  }, [q, pharmacyId]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await browsePharmacyInventory({
        pharmacyId: pharmacyId || undefined,
        search: q || undefined,
        page,
        limit: PAGE_LIMIT,
      });
      setItems(data.data.inventory);
      setPagination(data.data.pagination);
      setSuggestion(data.data.suggestion || null);
    } catch (err) {
      setError(true);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, q, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-display text-ink">{q ? `Results for "${q}"` : 'All medicines'}</h1>
          <p className="text-xs text-ink-faint mt-1">
            {pharmacyId ? `Showing results from ${pharmacyName}` : 'Showing results from every MedStock pharmacy'}
          </p>
        </div>
        <Button to="/shop/stores" variant="secondary" size="sm" icon={FiMapPin} className="shrink-0">
          {pharmacyId ? 'Change pharmacy' : 'Choose a pharmacy'}
        </Button>
      </div>

      {suggestion && !loading && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <FiAlertCircle className="shrink-0" />
          <span>
            No exact matches for "{q}". Did you mean{' '}
            <button
              type="button"
              onClick={() => setSearchParams({ q: suggestion.text })}
              className="font-semibold underline underline-offset-2 hover:text-amber-900"
            >
              {suggestion.text}
            </button>
            ?
          </span>
        </div>
      )}

      {loading ? (
        <SkeletonCardGrid count={12} />
      ) : error ? (
        <ErrorState title="Search failed" message="Something went wrong while searching. Please try again." onRetry={fetchResults} />
      ) : items.length === 0 ? (
        <EmptyState title="No medicines found" message="Try a different search term." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {items.map((item) => (
              <PharmacyMedicineCard key={item._id} item={item} showPharmacy={!pharmacyId} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                itemLabel="medicines"
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
