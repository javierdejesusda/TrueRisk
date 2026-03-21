'use client';
import { useState, useCallback, useEffect } from 'react';

export interface VegetationData {
  ndvi?: number;
  classification?: string;
  [key: string]: unknown;
}

export function useVegetation(provinceCode: string) {
  const [data, setData] = useState<VegetationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!provinceCode) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/vegetation/${provinceCode}`);
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
