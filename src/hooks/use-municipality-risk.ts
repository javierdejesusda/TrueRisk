'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';

interface MunicipalityRisk {
  ine_code: string;
  name: string;
  latitude: number;
  longitude: number;
  composite_score: number;
  dominant_hazard: string;
  severity: string;
  flood_score: number;
  wildfire_score: number;
  drought_score: number;
  heatwave_score: number;
  seismic_score: number;
  coldwave_score: number;
  windstorm_score: number;
  dana_score: number;
}

interface MunicipalityRiskData {
  province_code: string;
  computed_at: string | null;
  municipalities: MunicipalityRisk[];
}

export function useMunicipalityRisk(provinceCode: string | null) {
  const [data, setData] = useState<MunicipalityRiskData | null>(null);
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
        const res = await fetch(`/api/municipalities/${provinceCode}/risk`, { headers });
        if (res.ok && !cancelled) {
          setData(await res.json());
        }
      } catch {
        // silent - non-critical data
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [provinceCode, backendToken]);

  return { data, loading };
}
