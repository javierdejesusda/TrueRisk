'use client';
import { useState, useCallback, useEffect } from 'react';

export interface ReservoirData {
  name: string;
  lat?: number;
  lon?: number;
  capacity_hm3: number;
  volume_hm3: number;
  [key: string]: unknown;
}

export function useReservoirs() {
  const [data, setData] = useState<ReservoirData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data/reservoirs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1_800_000); // 30min
    return () => clearInterval(id);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
