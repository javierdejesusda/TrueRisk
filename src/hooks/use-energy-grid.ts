'use client';
import { useState, useCallback, useEffect } from 'react';

export interface EnergyData {
  current_demand_mw: number | null;
  max_demand_mw: number | null;
  min_demand_mw: number | null;
  values_count: number;
  generation_mix: Record<string, number>;
}

export function useEnergyGrid() {
  const [data, setData] = useState<EnergyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data/energy');
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
    const id = setInterval(refresh, 900_000); // 15min
    return () => clearInterval(id);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
