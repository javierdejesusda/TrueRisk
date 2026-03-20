'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { save, get } from '@/lib/offline-storage';
import type { Alert } from '@/types/alert';

const REFRESH_INTERVAL = 30_000;

export function useAlerts(filters?: { province?: string; hazard?: string }) {
  const setAlertsStore = useAppStore((s) => s.setAlerts);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ active: 'true' });
      if (filters?.province) params.set('province', filters.province);
      if (filters?.hazard) params.set('hazard', filters.hazard);

      const res = await fetch(`/api/alerts?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as Alert[];
      setAlerts(data);
      setAlertsStore(data);
      setError(null);
      save('alerts', 'active', data);
    } catch (err) {
      const cached = await get<Alert[]>('alerts', 'active');
      if (cached) {
        setAlerts(cached);
        setAlertsStore(cached);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, [setAlertsStore, filters?.province, filters?.hazard]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const hasActiveAlerts = alerts.length > 0;

  return { alerts, isLoading, error, hasActiveAlerts, refresh: fetchData };
}
