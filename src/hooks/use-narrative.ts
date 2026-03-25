'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

interface NarrativeData {
  available: boolean;
  province_code: string;
  type?: string;
  content_es?: string;
  content_en?: string;
  generated_at?: string;
}

export function useNarrative(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const [narrative, setNarrative] = useState<NarrativeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = provinceCode ?? storeCode;

  const fetchData = useCallback(async () => {
    if (!code) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/risk/${code}/narrative`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as NarrativeData;
      setNarrative(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch narrative');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) fetchData();
  }, [code, fetchData]);

  return { narrative, isLoading, error, refresh: fetchData };
}
