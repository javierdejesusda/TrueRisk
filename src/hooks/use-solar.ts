'use client';
import { useState, useCallback, useEffect } from 'react';

export interface SolarData {
  allsky_sfc_sw_dwn?: number;
  t2m?: number;
  prectotcorr?: number;
  rh2m?: number;
  ws2m?: number;
  [key: string]: unknown;
}

export function useSolar(provinceCode: string) {
  const [data, setData] = useState<SolarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!provinceCode) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/solar/${provinceCode}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [provinceCode]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3_600_000); // 1hr
    return () => clearInterval(id);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
