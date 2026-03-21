'use client';
import { useState, useCallback, useEffect } from 'react';

export interface Earthquake {
  magnitude: number;
  depth_km: number;
  lat: number;
  lon: number;
  timestamp: number;
  place: string;
  felt: number | null;
  tsunami: number;
}

export function useEarthquakes() {
  const [data, setData] = useState<Earthquake[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data/earthquakes');
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
    const id = setInterval(refresh, 600_000);
    return () => clearInterval(id);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
