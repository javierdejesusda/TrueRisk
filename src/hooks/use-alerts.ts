'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import type { Alert } from '@/types/alert';
import type { ApiResponse } from '@/types/api';

const REFRESH_INTERVAL = 30_000; // 30 seconds

export function useAlerts() {
  const setAlertsStore = useAppStore((s) => s.setAlerts);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?active=true');
      const json = (await res.json()) as ApiResponse<Alert[]>;

      if (json.success && json.data) {
        setAlerts(json.data);
        setAlertsStore(json.data);
        setError(null);
      } else {
        setError(json.error ?? 'Failed to fetch alerts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, [setAlertsStore]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const hasActiveAlerts = alerts.length > 0;

  return { alerts, isLoading, error, hasActiveAlerts, refresh: fetchData };
}
