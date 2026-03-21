'use client';
import { useState, useCallback, useEffect } from 'react';

export interface SeismicData {
  max_magnitude?: number;
  closest_distance_km?: number;
  cumulative_energy?: number;
  event_count?: number;
  [key: string]: unknown;
}

export function useSeismic(provinceCode: string) {
  const [data, setData] = useState<SeismicData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!provinceCode) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/seismic/${provinceCode}`);
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
    const id = setInterval(refresh, 600_000); // 10min
    return () => clearInterval(id);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
