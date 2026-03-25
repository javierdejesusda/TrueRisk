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
}

export function useDroughtDashboard(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const code = provinceCode ?? storeCode;

  const [data, setData] = useState<DroughtData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!code) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drought/${code}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drought data');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) fetchData();
  }, [code, fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
