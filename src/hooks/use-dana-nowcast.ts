'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

export interface DanaNowcast {
  province_code: string;
  current_score: number;
  nowcast: {
    t1h: number;
    t3h: number;
    t6h: number;
  };
  cape_current: number;
  cape_max_6h: number;
  precip_forecast_6h: number;
  precip_forecast_24h: number;
  computed_at: string;
}

export function useDanaNowcast(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const [data, setData] = useState<DanaNowcast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const code = provinceCode ?? storeCode;

  const fetchData = useCallback(async () => {
    if (!code) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/risk/${code}/dana-nowcast`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DanaNowcast;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch DANA nowcast');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) fetchData();
  }, [code, fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
