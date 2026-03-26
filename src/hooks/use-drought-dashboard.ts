'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

export interface DroughtClassification {
  class: string;
  label: string;
  severity: number;
  color: string;
}

export interface WaterRestriction {
  level: number;
  description: string;
  source: string;
  effective_date: string | null;
}

export interface DroughtData {
  province_code: string;
  spei_1m: number;
  spei_3m: number;
  drought_score: number;
  classification: DroughtClassification;
  restrictions: WaterRestriction[];
  data_available?: boolean;
}

export function useDroughtDashboard(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const code = provinceCode ?? storeCode;

  const [data, setData] = useState<DroughtData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!code) {
      setIsLoading(false);
      setData(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drought/${code}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drought data');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchData();
  }, [code, fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
