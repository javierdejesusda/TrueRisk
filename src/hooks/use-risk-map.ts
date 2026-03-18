'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { RiskMapResponse, RiskMapEntry } from '@/types/risk';

const REFRESH_INTERVAL = 300_000;

export function useRiskMap() {
  const [riskMap, setRiskMap] = useState<RiskMapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/risk/map');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RiskMapResponse;
      setRiskMap(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk map');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const byProvince = useMemo(() => {
    const map: Record<string, RiskMapEntry> = {};
    if (riskMap) {
      for (const entry of riskMap.provinces) {
        map[entry.province_code] = entry;
      }
    }
    return map;
  }, [riskMap]);

  return { riskMap, byProvince, isLoading, error, refresh: fetchData };
}
