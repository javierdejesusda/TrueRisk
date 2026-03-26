'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';

interface ScenarioData {
  temp_anomaly_c: number;
  precip_change_pct: number;
  extreme_heat_days: number;
  drought_risk_change_pct: number;
}

interface DecadeData {
  ssp245: ScenarioData;
  ssp585: ScenarioData;
}

interface ClimateProjection {
  province_code: string;
  climate_zone: string;
  decades: Record<string, DecadeData>;
}

export function useClimateProjections(provinceCode: string | null) {
  const [data, setData] = useState<ClimateProjection | null>(null);
  const [loading, setLoading] = useState(false);
  const backendToken = useAppStore((s) => s.backendToken);

  useEffect(() => {
    if (!provinceCode) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchData = async () => {
      try {
        const headers: Record<string, string> = {};
        if (backendToken) headers['Authorization'] = `Bearer ${backendToken}`;
        const res = await fetch(`/api/climate/projections/${provinceCode}`, { headers });
        if (res.ok && !cancelled) {
          setData(await res.json());
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [provinceCode, backendToken]);

  return { data, loading };
}
