'use client';
import { useState, useCallback, useEffect } from 'react';

export interface RiverGaugeFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    gauge_id: string;
    name: string;
    river: string;
    basin: string;
    flow_m3s: number | null;
    level_m: number | null;
    status: 'normal' | 'alert' | 'warning' | 'critical' | 'offline';
  };
}

export function useRiverGauges() {
  const [data, setData] = useState<RiverGaugeFeature[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data/river-gauges/geojson');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const geojson = await res.json();
      setData(geojson.features ?? []);
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
