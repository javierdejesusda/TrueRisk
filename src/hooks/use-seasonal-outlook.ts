'use client';
import { useState, useCallback, useEffect } from 'react';

export interface SeasonalOutlookData {
  temperature_anomaly?: number;
  precipitation_anomaly?: number;
  [key: string]: unknown;
}

export function useSeasonalOutlook(provinceCode: string) {
  const [data, setData] = useState<SeasonalOutlookData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!provinceCode) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/seasonal/${provinceCode}`);
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
    const id = setInterval(refresh, 86_400_000); // 24hr
    return () => clearInterval(id);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
