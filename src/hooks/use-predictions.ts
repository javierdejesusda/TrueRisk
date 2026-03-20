'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import type { PredictionResponse } from '@/components/predictions/shared';

export function usePredictions(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const code = provinceCode ?? storeCode;
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/analysis/predictions?province=${code}`);
      if (!res.ok) {
        const text = await res.text();
        let detail = `HTTP ${res.status}`;
        try { detail = JSON.parse(text).detail ?? detail; } catch { /* plain text error */ }
        throw new Error(detail);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 300_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
