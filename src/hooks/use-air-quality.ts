'use client';
import { useState, useCallback, useEffect } from 'react';

export interface AirQualityData {
  station_name: string;
  location_id: number;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  co: number | null;
  so2: number | null;
  no: number | null;
  available_params: string[];
}

export function useAirQuality(provinceCode: string) {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!provinceCode) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/air-quality/${provinceCode}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(Object.keys(json).length > 0 ? json : null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [provinceCode]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 600_000);
    return () => clearInterval(id);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
