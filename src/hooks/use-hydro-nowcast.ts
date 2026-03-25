'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

interface FlowPrediction {
  hour: number;
  estimated_flow_m3s: number;
  runoff_flow_m3s: number;
  above_base_pct: number;
}

export interface HydroNowcast {
  province_code: string;
  available: boolean;
  message?: string;
  catchment?: string;
  catchment_area_km2?: number;
  base_flow_m3s?: number;
  risk_level?: 'normal' | 'elevated' | 'moderate' | 'high' | 'critical';
  predictions?: {
    t1h: FlowPrediction | null;
    t3h: FlowPrediction | null;
    t6h: FlowPrediction | null;
  };
  flow_series?: FlowPrediction[];
}

export function useHydroNowcast(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const [data, setData] = useState<HydroNowcast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const code = provinceCode ?? storeCode;

  const fetchData = useCallback(async () => {
    if (!code) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/risk/${code}/hydro-nowcast`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as HydroNowcast;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hydro nowcast');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) fetchData();
  }, [code, fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
