import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSearch } from 'react-icons/fi';
import {
  discoverPharmacies,
  getMyConnections,
  sendConnectionRequest,
  cancelConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  blockConnection,
  unblockConnection,
} from '../../services/pharmacyNetworkService';
import PageHeader from '../../components/PageHeader';
import NetworkTabNav from '../../components/pharmacyNetwork/NetworkTabNav';
import PharmacyCard from '../../components/pharmacyNetwork/PharmacyCard';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import Pagination from '../../components/Pagination';
import { SkeletonCardGrid } from '../../components/Skeleton';
import usePharmacyNetworkBadge from '../../hooks/usePharmacyNetworkBadge';

const PharmacyNetworkFind = () => {
  const navigate = useNavigate();
  const { pendingRequestCount } = usePharmacyNetworkBadge();

  const [pharmacies, setPharmacies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const connectionByPharmacyId = new Map(
    connections.map((c) => [c.otherPharmacy?._id, c]).filter(([id]) => id)
  );

  const refreshConnections = useCallback(async () => {
    try {
      const { data } = await getMyConnections();
      setConnections(data.data.connections);
    } catch {
      // non-fatal - cards just show "Connect" until this succeeds
    }
  }, []);

  const fetchPharmacies = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await discoverPharmacies({ page, limit: 12, search: search || undefined, city: city || undefined });
      setPharmacies(data.data.pharmacies);
      setPagination(data.data.pagination);
    } catch {
      toast.error("We couldn't load pharmacies. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, city]);

  useEffect(() => {
    refreshConnections();
  }, [refreshConnections]);

  useEffect(() => {
    fetchPharmacies(1);
  }, [fetchPharmacies]);

  const withRefresh = (fn) => async (...args) => {
    try {
      await fn(...args);
      await refreshConnections();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleMessage = (conversationId) => navigate(`/network/${conversationId}`);

  return (
    <div className="space-y-5">
      <PageHeader title="Find Pharmacies" description="Search and connect with other pharmacies on the network." />

      <NetworkTabNav pendingRequestCount={pendingRequestCount} />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex flex-col sm:flex-row gap-3">
        <FormField
          className="flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pharmacies by name..."
          icon={FiSearch}
        />
        <FormField
          className="sm:w-56"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Filter by city..."
        />
      </div>

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : pharmacies.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <EmptyState title="No pharmacies found" message="Try another pharmacy name or location." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pharmacies.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy._id}
                pharmacy={pharmacy}
                connection={connectionByPharmacyId.get(pharmacy._id) || null}
                onSendRequest={withRefresh(sendConnectionRequest)}
                onCancel={withRefresh(cancelConnectionRequest)}
                onAccept={withRefresh(acceptConnectionRequest)}
                onDecline={withRefresh(declineConnectionRequest)}
                onBlock={withRefresh(blockConnection)}
                onUnblock={withRefresh(unblockConnection)}
                onMessage={handleMessage}
              />
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                itemLabel="pharmacies"
                onPageChange={fetchPharmacies}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PharmacyNetworkFind;
