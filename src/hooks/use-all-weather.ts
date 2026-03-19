'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CurrentWeather } from '@/types/weather';
import { PROVINCE_COORDS } from '@/lib/provinces';

const REFRESH_INTERVAL = 300_000;

export interface WeatherMarker {
  province_code: string;
  temperature: number;
  latitude: number;
  longitude: number;
}

export function useAllWeather() {
  const [data, setData] = useState<CurrentWeather[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/weather/all');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as CurrentWeather[];
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch all weather');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const markers = useMemo<WeatherMarker[]>(() => {
    return data
      .map((w) => {
        const coords = PROVINCE_COORDS[w.province_code];
        if (!coords || w.temperature == null) return null;
        return {
          province_code: w.province_code,
          temperature: w.temperature,
          latitude: coords.lat,
          longitude: coords.lng,
        };
      })
      .filter((m): m is WeatherMarker => m !== null);
  }, [data]);

  return { data, markers, isLoading, error, refresh: fetchData };
}
