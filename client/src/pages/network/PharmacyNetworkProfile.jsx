import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheckCircle, FiLayers, FiMail, FiMapPin, FiPackage, FiPhone } from 'react-icons/fi';
import {
  getPharmacyProfile,
  sendConnectionRequest,
  cancelConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  blockConnection,
  unblockConnection,
} from '../../services/pharmacyNetworkService';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import ConnectionActionButton from '../../components/pharmacyNetwork/ConnectionActionButton';
import { SkeletonDetail } from '../../components/Skeleton';

const PharmacyNetworkProfile = () => {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await getPharmacyProfile(pharmacyId);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      else toast.error("We couldn't load this pharmacy's profile.");
    } finally {
      setLoading(false);
    }
  }, [pharmacyId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const withRefresh = (fn) => async (...args) => {
    try {
      await fn(...args);
      await fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Pharmacy Profile" description="Loading..." />
        <SkeletonDetail />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="space-y-5">
        <PageHeader title="Pharmacy Profile" description="Find Pharmacies" />
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <EmptyState title="Pharmacy not found" message="This pharmacy may have been removed." />
        </div>
      </div>
    );
  }

  const { pharmacy, stats, connection } = data;

  return (
    <div className="space-y-5">
      <Link to="/network/find" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brandPrimary">
        <FiArrowLeft size={15} /> Back to Find Pharmacies
      </Link>

      <PageHeader
        title={pharmacy.name}
        description={pharmacy.isVerified ? '✓ Verified Pharmacy' : 'Pharmacy'}
        action={
          <ConnectionActionButton
            connection={connection}
            otherPharmacyId={pharmacy._id}
            otherPharmacyStatus={pharmacy.status}
            onSendRequest={withRefresh(sendConnectionRequest)}
            onCancel={withRefresh(cancelConnectionRequest)}
            onAccept={withRefresh(acceptConnectionRequest)}
            onDecline={withRefresh(declineConnectionRequest)}
            onBlock={withRefresh(blockConnection)}
            onUnblock={withRefresh(unblockConnection)}
            onMessage={(conversationId) => navigate(`/network/${conversationId}`)}
            size="md"
          />
        }
      />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <FiMapPin size={15} className="text-brandPrimary shrink-0" />
          {pharmacy.city}, {pharmacy.state}
        </div>
        {pharmacy.phone && (
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <FiPhone size={15} className="text-brandPrimary shrink-0" />
            {pharmacy.phone}
          </div>
        )}
        {pharmacy.email && (
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <FiMail size={15} className="text-brandPrimary shrink-0" />
            {pharmacy.email}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <FiCheckCircle size={15} className={pharmacy.status === 'active' ? 'text-emerald-500' : 'text-slate-400'} />
          {pharmacy.status === 'active' ? 'Active' : 'Inactive'} · {pharmacy.pharmacyId}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={FiPackage} label="Products" value={stats.productCount} bgTint="bg-primary-50" iconColor="text-brandPrimary" />
        <StatCard icon={FiLayers} label="Categories" value={stats.categoryCount} bgTint="bg-primary-50" iconColor="text-brandPrimary" />
      </div>
    </div>
  );
};

export default PharmacyNetworkProfile;
