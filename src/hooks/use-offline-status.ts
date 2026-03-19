'use client';

import { useState, useEffect } from 'react';

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      setIsOffline(false);
      setLastSyncedAt(new Date().toISOString());
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    if (navigator.onLine) {
      setLastSyncedAt(new Date().toISOString());
    }

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return { isOffline, lastSyncedAt };
}
