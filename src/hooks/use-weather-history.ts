'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

export interface WeatherHistoryRecord {
  id: number;
  province_code: string;
  source: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gusts: number | null;
  pressure: number | null;
  soil_moisture: number | null;
  uv_index: number | null;
  dew_point: number | null;
  cloud_cover: number | null;
  recorded_at: string;
  created_at: string;
}

export function useWeatherHistory(provinceCode?: string, days: number = 7) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const [data, setData] = useState<WeatherHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = provinceCode ?? storeCode;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather/history/${code}?days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const records = (await res.json()) as WeatherHistoryRecord[];
      setData(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [code, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
