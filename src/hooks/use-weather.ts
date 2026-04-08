'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import type { CurrentWeather } from '@/types/weather';

const REFRESH_INTERVAL = 300_000;

export function useWeather(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const setWeatherStore = useAppStore((s) => s.setWeather);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = provinceCode ?? storeCode;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/weather/current/${code}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as CurrentWeather;
      setWeather(data);
      setWeatherStore(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
      // Don't clear weather -- keep previous data visible
    } finally {
      setIsLoading(false);
    }
  }, [code, setWeatherStore]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { weather, isLoading, error, refresh: fetchData };
}
