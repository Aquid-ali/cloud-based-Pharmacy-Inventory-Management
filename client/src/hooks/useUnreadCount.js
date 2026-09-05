import { useCallback, useEffect, useState } from 'react';
import { getUnreadCount } from '../services/conversationService';
import useAuth from './useAuth';
import useInterval from './useInterval';

const POLL_MS = 15000;

/** Powers the "Messages" nav badge on both the customer and admin sides. */
export default function useUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data.data.unreadCount);
    } catch {
      // non-fatal - the badge just doesn't update this cycle
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInterval(refresh, user ? POLL_MS : null);

  return unreadCount;
}
