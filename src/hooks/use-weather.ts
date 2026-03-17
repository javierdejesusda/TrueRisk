'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import type { ParsedWeather } from '@/types/weather';
import type { ApiResponse } from '@/types/api';

const REFRESH_INTERVAL = 60_000; // 60 seconds

export function useWeather() {
  const setWeatherStore = useAppStore((s) => s.setWeather);
  const [weather, setWeather] = useState<ParsedWeather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/weather/current');
      const json = (await res.json()) as ApiResponse<ParsedWeather>;

      if (json.success && json.data) {
        setWeather(json.data);
        setWeatherStore(json.data);
        setError(null);
      } else {
        setError(json.error ?? 'Failed to fetch weather');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setIsLoading(false);
    }
  }, [setWeatherStore]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { weather, isLoading, error, refresh: fetchData };
}
