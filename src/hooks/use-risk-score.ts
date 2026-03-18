'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import type { CompositeRiskScore } from '@/types/risk';

export function useRiskScore(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const setRisk = useAppStore((s) => s.setRisk);
  const [risk, setRiskState] = useState<CompositeRiskScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = provinceCode ?? storeCode;

  const fetchData = useCallback(async () => {
    if (!code) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/risk/${code}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as CompositeRiskScore;
      setRiskState(data);
      setRisk(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk score');
    } finally {
      setIsLoading(false);
    }
  }, [code, setRisk]);

  useEffect(() => {
    if (code) fetchData();
  }, [code, fetchData]);

  return { risk, isLoading, error, refresh: fetchData };
}
