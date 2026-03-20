'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

export interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  description: string;
}

export interface HazardExplanation {
  hazard: string;
  score: number;
  contributions: FeatureContribution[];
}

export interface RiskExplainData {
  province_code: string;
  computed_at: string;
  hazards: HazardExplanation[];
}

export function useRiskExplain(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const [data, setData] = useState<RiskExplainData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = provinceCode ?? storeCode;

  const fetchData = useCallback(async () => {
    if (!code) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/risk/${code}/explain`);
      if (!res.ok) {
        if (res.status === 404) {
          setData(null);
          setError(null);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json() as RiskExplainData;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch explanations');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) fetchData();
  }, [code, fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
