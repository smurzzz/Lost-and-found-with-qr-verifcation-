/**
 * Register the device's push token once the student is signed in (Phase 6).
 * Mounted from the student home; best-effort and non-blocking.
 */

import { useEffect } from 'react';

import { syncPushToken } from '@/lib/push';
import { useSession } from '@/lib/session';

export function usePushTokenSync() {
  const { dbUser, isDemo } = useSession();

  useEffect(() => {
    if (isDemo || !dbUser?.id) return;
    void syncPushToken(dbUser.id);
  }, [dbUser?.id, isDemo]);
}
