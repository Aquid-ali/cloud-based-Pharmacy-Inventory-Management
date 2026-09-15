import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiMapPin } from 'react-icons/fi';
import {
  getMyConnections,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  blockConnection,
  unblockConnection,
} from '../../services/pharmacyNetworkService';
import PageHeader from '../../components/PageHeader';
import NetworkTabNav from '../../components/pharmacyNetwork/NetworkTabNav';
import ConnectionActionButton from '../../components/pharmacyNetwork/ConnectionActionButton';
import EmptyState from '../../components/EmptyState';
import { SkeletonRows } from '../../components/Skeleton';
import usePharmacyNetworkBadge from '../../hooks/usePharmacyNetworkBadge';

const ConnectionRow = ({ connection, ...handlers }) => (
  <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-2xl bg-primary-50 text-brandPrimary flex items-center justify-center font-display font-bold shrink-0">
        {connection.otherPharmacy?.name?.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-ink truncate">{connection.otherPharmacy?.name}</p>
          {connection.otherPharmacy?.isVerified && <FiCheckCircle className="text-brandPrimary shrink-0" size={13} />}
        </div>
        <p className="text-xs text-ink-faint flex items-center gap-1">
          <FiMapPin size={10} /> {connection.otherPharmacy?.city}, {connection.otherPharmacy?.state}
        </p>
      </div>
    </div>
    <ConnectionActionButton connection={connection} otherPharmacyId={connection.otherPharmacy?._id} otherPharmacyStatus={connection.otherPharmacy?.status} {...handlers} />
  </div>
);

const Section = ({ title, loading, items, emptyMessage, ...handlers }) => (
  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
    <h2 className="text-sm font-bold text-ink mb-3">{title}</h2>
    {loading ? (
      <SkeletonRows count={2} />
    ) : items.length === 0 ? (
      <p className="text-xs text-ink-faint py-4 text-center">{emptyMessage}</p>
    ) : (
      <div className="space-y-2">
        {items.map((c) => (
          <ConnectionRow key={c._id} connection={c} {...handlers} />
        ))}
      </div>
    )}
  </div>
);

const PharmacyNetworkRequests = () => {
  const navigate = useNavigate();
  const { pendingRequestCount } = usePharmacyNetworkBadge();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      const { data } = await getMyConnections();
      setConnections(data.data.connections);
    } catch {
      toast.error("We couldn't load your connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const withRefresh = (fn) => async (...args) => {
    try {
      await fn(...args);
      await fetchConnections();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    }
  };

  const handlers = {
    onAccept: withRefresh(acceptConnectionRequest),
    onDecline: withRefresh(declineConnectionRequest),
    onCancel: withRefresh(cancelConnectionRequest),
    onBlock: withRefresh(blockConnection),
    onUnblock: withRefresh(unblockConnection),
    onMessage: (conversationId) => navigate(`/network/${conversationId}`),
  };

  const incoming = connections.filter((c) => c.status === 'pending' && !c.requestedByMe);
  const sent = connections.filter((c) => c.status === 'pending' && c.requestedByMe);
  const accepted = connections.filter((c) => c.status === 'accepted' || c.status === 'blocked');

  if (!loading && connections.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Requests & Connections" description="Manage incoming requests and connected pharmacies." />
        <NetworkTabNav pendingRequestCount={pendingRequestCount} />
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <EmptyState
            title="No requests yet"
            message="Connect with another pharmacy from Find Pharmacies to get started."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Requests & Connections" description="Manage incoming requests and connected pharmacies." />
      <NetworkTabNav pendingRequestCount={pendingRequestCount} />

      <Section title="Incoming Requests" loading={loading} items={incoming} emptyMessage="No incoming requests." {...handlers} />
      <Section title="Sent Requests" loading={loading} items={sent} emptyMessage="No pending sent requests." {...handlers} />
      <Section title="Connections" loading={loading} items={accepted} emptyMessage="No connections yet." {...handlers} />
    </div>
  );
};

export default PharmacyNetworkRequests;
