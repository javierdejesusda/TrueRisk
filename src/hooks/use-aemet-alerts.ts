'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AemetCapAlert } from '@/types/aemet';

const REFRESH_INTERVAL = 300_000;

export function useAemetAlerts() {
  const [alerts, setAlerts] = useState<AemetCapAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts/aemet');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as AemetCapAlert[];
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AEMET alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { alerts, isLoading, error, refresh: fetchData };
}
