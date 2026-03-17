'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AemetCapAlert, AemetAlertResponse } from '@/types/aemet';
import type { ApiResponse } from '@/types/api';

const REFRESH_INTERVAL = 300_000; // 5 minutes

export function useAemetAlerts(area = 'esp') {
  const [alerts, setAlerts] = useState<AemetCapAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/alerts/aemet?area=${area}`);
      const json = (await res.json()) as ApiResponse<AemetAlertResponse>;

      if (json.success && json.data) {
        setAlerts(json.data.alerts);
        setError(null);
      } else {
        setError(json.error ?? 'Failed to fetch AEMET alerts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AEMET alerts');
    } finally {
      setIsLoading(false);
    }
  }, [area]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { alerts, isLoading, error, refresh: fetchData };
}
