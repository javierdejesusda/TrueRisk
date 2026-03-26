'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SafePointData {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  province_code?: string;
}

export interface EvacuationRoute {
  safe_point: SafePointData;
  distance_km: number;
  bearing: string;
  estimated_time_min: number;
}

export function useEvacuationRoutes(
  lat: number | null,
  lon: number | null,
  province?: string | null,
  type?: string | null,
  limit: number = 5,
) {
  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    if (lat == null || lon == null) return;
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        limit: String(limit),
      });
      if (province) params.set('province', province);
      if (type) params.set('type', type);

      const res = await fetch(`/api/evacuation/routes?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as EvacuationRoute[];
      setRoutes(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon, province, type, limit]);

  useEffect(() => {
    if (lat != null && lon != null) fetchRoutes();
  }, [lat, lon, fetchRoutes]);

  return { routes, isLoading, error, refresh: fetchRoutes };
}

export function useSafePoints(province?: string | null, enabled: boolean = true) {
  const [points, setPoints] = useState<SafePointData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      // First try with province filter
      const params = new URLSearchParams();
      if (province) params.set('province', province);
      const res = await fetch(`/api/evacuation/safe-points?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let json = (await res.json()) as SafePointData[];

      // If province filter returned no results, fetch all available points
      if (json.length === 0 && province) {
        const allRes = await fetch('/api/evacuation/safe-points');
        if (allRes.ok) {
          json = (await allRes.json()) as SafePointData[];
        }
      }

      setPoints(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch safe points');
    } finally {
      setIsLoading(false);
    }
  }, [province, enabled]);

  useEffect(() => {
    if (enabled) fetchPoints();
  }, [enabled, fetchPoints]);

  return { points, isLoading, error, refresh: fetchPoints };
}
