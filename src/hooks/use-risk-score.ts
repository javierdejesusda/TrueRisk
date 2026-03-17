'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import type { RiskScore } from '@/types/risk';
import type { ApiResponse } from '@/types/api';

export function useRiskScore() {
  const user = useAppStore((s) => s.user);
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/analysis/risk?userId=${user.id}`);
      const json = (await res.json()) as ApiResponse<RiskScore>;

      if (json.success && json.data) {
        setRisk(json.data);
        setError(null);
      } else {
        setError(json.error ?? 'Failed to fetch risk score');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk score');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  return { risk, isLoading, error, refresh: fetchData };
}
