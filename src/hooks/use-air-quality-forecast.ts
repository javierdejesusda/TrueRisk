'use client';
import { useState, useCallback, useEffect } from 'react';

export interface AirQualityForecastData {
  pm2_5?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  [key: string]: unknown;
}

export function useAirQualityForecast(provinceCode: string) {
  const [data, setData] = useState<AirQualityForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!provinceCode) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/air-quality-forecast/${provinceCode}`);
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
