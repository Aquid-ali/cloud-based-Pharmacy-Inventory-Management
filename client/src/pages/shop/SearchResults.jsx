import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin } from 'react-icons/fi';
import { browsePharmacyInventory } from '../../services/pharmacyService';
import PharmacyMedicineCard from '../../components/shop/PharmacyMedicineCard';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import { SkeletonCardGrid } from '../../components/Skeleton';
import useCart from '../../hooks/useCart';

const SearchResults = () => {
  const { pharmacyId, pharmacyName } = useCart();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await browsePharmacyInventory({
        pharmacyId: pharmacyId || undefined,
        search: q || undefined,
        limit: 40,
      });
      setItems(data.data.inventory);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, q]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-serif text-ink">{q ? `Results for "${q}"` : 'All medicines'}</h1>
          <p className="text-xs text-ink-faint mt-1">
            {pharmacyId ? `Showing results from ${pharmacyName}` : 'Showing results from every MedStock pharmacy'}
          </p>
        </div>
        <Button to="/shop/stores" variant="secondary" size="sm" icon={FiMapPin} className="shrink-0">
          {pharmacyId ? 'Change pharmacy' : 'Choose a pharmacy'}
        </Button>
      </div>

      {loading ? (
        <SkeletonCardGrid count={12} />
      ) : items.length === 0 ? (
        <EmptyState title="No medicines found" message="Try a different search term." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {items.map((item) => (
            <PharmacyMedicineCard key={item._id} item={item} showPharmacy={!pharmacyId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
