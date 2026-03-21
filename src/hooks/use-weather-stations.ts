'use client';
import { useState, useCallback, useEffect } from 'react';

export interface WeatherStation {
  idema?: string;
  ubi?: string;
  lat?: number;
  lon?: number;
  alt?: number;
  ta?: number;
  hr?: number;
  prec?: number;
  vv?: number;
  [key: string]: unknown;
}

export function useWeatherStations() {
  const [data, setData] = useState<WeatherStation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data/weather-stations');
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
    const id = setInterval(refresh, 300_000); // 5min
    return () => clearInterval(id);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
