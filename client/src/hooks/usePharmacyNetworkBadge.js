import { useCallback, useEffect, useState } from 'react';
import { getPharmacyNetworkUnreadSummary } from '../services/pharmacyNetworkService';
import useAuth from './useAuth';
import useInterval from './useInterval';

const POLL_MS = 15000;

/** Powers the "Pharmacy Network" nav badge - unread B2B messages + pending incoming connection requests. */
export default function usePharmacyNetworkBadge() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ messageUnreadCount: 0, pendingRequestCount: 0, total: 0 });

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getPharmacyNetworkUnreadSummary();
      setSummary(data.data);
    } catch {
      // non-fatal - the badge just doesn't update this cycle
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInterval(refresh, user ? POLL_MS : null);

  return summary;
}
