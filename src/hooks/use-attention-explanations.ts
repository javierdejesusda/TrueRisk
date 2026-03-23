'use client';
import { useState, useCallback, useEffect } from 'react';

export interface FeatureContribution {
  feature: string;
  attention_weight: number;
  contribution_pct: number;
  description: string;
}

export interface AttentionExplanation {
  hazard_type: string;
  province_code: string;
  forecast_horizon_hours: number | null;
  predicted_score: number;
  confidence_lower: number | null;
  confidence_upper: number | null;
  top_features: FeatureContribution[];
  generated_at: string | null;
}

export function useAttentionExplanations(provinceCode: string | null, hazard?: string) {
  const [data, setData] = useState<AttentionExplanation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!provinceCode) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (hazard) params.set('hazard', hazard);
      const url = `/api/risk/${provinceCode}/explain/attention${params.toString() ? '?' + params : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [provinceCode, hazard]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, isLoading, error, refresh };
}
