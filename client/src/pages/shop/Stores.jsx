import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiNavigation, FiArrowLeft, FiSearch } from 'react-icons/fi';
import { getPharmacies, getNearbyPharmacies } from '../../services/pharmacyService';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import { SkeletonBlock } from '../../components/Skeleton';
import PharmacyListItem from '../../components/map/PharmacyListItem';
import PharmacyInfoCard from '../../components/map/PharmacyInfoCard';
import useCart from '../../hooks/useCart';

// Lazy-loaded so the Google Maps script/bundle is only ever fetched when this
// page actually renders it - no other route pulls it in.
const PharmacyMap = React.lazy(() => import('../../components/map/PharmacyMap'));

const RADIUS_OPTIONS = [1, 5, 10];
const SEARCH_DEBOUNCE_MS = 300;

const Stores = () => {
  const navigate = useNavigate();
  const { pharmacyId, selectPharmacy } = useCart();
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [radiusFilter, setRadiusFilter] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [directionsRequest, setDirectionsRequest] = useState(null);
  const [directionsResult, setDirectionsResult] = useState(null);

  // Selecting a (possibly different) pharmacy always clears any in-progress
  // or previously-shown route, so an old result can never be mistaken for
  // belonging to the newly selected pharmacy.
  const selectPharmacyId = (id) => {
    setSelectedId(id);
    setDirectionsRequest(null);
    setDirectionsResult(null);
  };

  const handleGetDirections = (travelMode) => {
    setDirectionsResult(null);
    setDirectionsRequest({ travelMode });
  };

  const loadAllPharmacies = async () => {
    setLoading(true);
    try {
      const { data } = await getPharmacies({ status: 'active', limit: 100 });
      setPharmacies(data.data.pharmacies);
    } catch (error) {
      toast.error('Failed to load pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const { data } = await getNearbyPharmacies(latitude, longitude);
          setPharmacies(data.data.pharmacies);
          setLocationDenied(false);
          toast.success('Showing pharmacies near you');
        } catch (error) {
          toast.error('Failed to load nearby pharmacies');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationDenied(true);
        setLocating(false);
        toast.error('Location access denied — showing all pharmacies instead');
      }
    );
  };

  useEffect(() => {
    loadAllPharmacies();
  }, []);

  // Debounce the search box so typing doesn't rebuild the map's markers on
  // every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const hasDistanceData = pharmacies.some((p) => p.distanceKm !== undefined);

  const filteredPharmacies = useMemo(() => {
    let list = pharmacies;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
      );
    }
    if (radiusFilter) {
      list = list.filter((p) => p.distanceKm !== undefined && p.distanceKm <= radiusFilter);
    }
    return [...list].sort((a, b) => {
      if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
      if (a.distanceKm === undefined) return 1;
      if (b.distanceKm === undefined) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [pharmacies, search, radiusFilter]);

  // Deselect if a filter change drops the selected pharmacy from view.
  useEffect(() => {
    if (selectedId && !filteredPharmacies.some((p) => p._id === selectedId)) {
      selectPharmacyId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPharmacies, selectedId]);

  const selectedPharmacy = filteredPharmacies.find((p) => p._id === selectedId) || null;

  const handleView = (pharmacy) => {
    if (selectPharmacy(pharmacy)) navigate('/shop');
  };

  return (
    <div className="space-y-5">
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brandPrimary">
        <FiArrowLeft size={14} /> Back to all medicines &amp; pharmacies
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-ink">Find a nearby pharmacy</h1>
          <p className="text-xs text-ink-soft mt-1">Pick a pharmacy to check its live stock and pricing.</p>
        </div>
        <Button onClick={loadNearby} loading={locating} icon={FiNavigation} className="shrink-0">
          {locating ? 'Locating...' : 'Use my location'}
        </Button>
      </div>

      {locationDenied && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl px-4 py-3">
          Location access is disabled. Enable location access in your browser to see distances and find pharmacies near you — you can still browse and search every pharmacy below.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <FormField
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search pharmacies by name or city..."
          icon={FiSearch}
          className="sm:max-w-xs"
        />
        {hasDistanceData && (
          <div className="flex flex-wrap items-center gap-2">
            {RADIUS_OPTIONS.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadiusFilter((r) => (r === km ? null : km))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  radiusFilter === km
                    ? 'bg-brandPrimary text-white border-brandPrimary'
                    : 'bg-white text-ink-soft border-slate-200 hover:border-brandPrimary/40'
                }`}
              >
                Within {km} km
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : pharmacies.length === 0 ? (
        <EmptyState title="No pharmacies found" message="Check back later for pharmacy availability." />
      ) : filteredPharmacies.length === 0 ? (
        <EmptyState
          title={radiusFilter ? 'No pharmacies found within this distance' : 'Nothing matched that search'}
          message={
            radiusFilter
              ? 'Try increasing the search radius.'
              : 'Try a different name or city, or clear the search.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4">
          {/* List column */}
          <div className="order-2 md:order-1 space-y-3 md:max-h-[600px] md:overflow-y-auto md:pr-1">
            {filteredPharmacies.map((pharmacy) => (
              <div key={pharmacy._id}>
                <PharmacyListItem
                  pharmacy={pharmacy}
                  selected={selectedId === pharmacy._id}
                  isCurrent={pharmacyId === pharmacy._id}
                  onSelect={selectPharmacyId}
                />
                {/* Mobile: info card expands inline right under the selected row */}
                {selectedId === pharmacy._id && (
                  <div className="md:hidden mt-2">
                    <PharmacyInfoCard
                      pharmacy={pharmacy}
                      isCurrent={pharmacyId === pharmacy._id}
                      onClose={() => selectPharmacyId(null)}
                      onView={() => handleView(pharmacy)}
                      userLocation={userLocation}
                      activeTravelMode={directionsRequest?.travelMode}
                      onGetDirections={handleGetDirections}
                      directionsLoading={Boolean(directionsRequest) && !directionsResult}
                      directionsResult={directionsResult}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Single map instance - CSS `order` repositions it responsively,
              it's never duplicated/remounted across breakpoints. */}
          <div className="order-1 md:order-2 relative h-64 md:h-[600px] rounded-3xl overflow-hidden border border-slate-200/80">
            <Suspense fallback={<SkeletonBlock className="w-full h-full" />}>
              <PharmacyMap
                pharmacies={filteredPharmacies}
                userLocation={userLocation}
                selectedId={selectedId}
                onSelect={selectPharmacyId}
                directionsRequest={directionsRequest}
                onDirectionsResult={setDirectionsResult}
              />
            </Suspense>
            {selectedPharmacy && (
              <div className="hidden md:block absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-10">
                <PharmacyInfoCard
                  pharmacy={selectedPharmacy}
                  isCurrent={pharmacyId === selectedPharmacy._id}
                  onClose={() => selectPharmacyId(null)}
                  onView={() => handleView(selectedPharmacy)}
                  userLocation={userLocation}
                  activeTravelMode={directionsRequest?.travelMode}
                  onGetDirections={handleGetDirections}
                  directionsLoading={Boolean(directionsRequest) && !directionsResult}
                  directionsResult={directionsResult}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stores;
