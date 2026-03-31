'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
}

const SPAIN_BOUNDS = {
  mainland: { minLat: 35.8, maxLat: 43.8, minLng: -9.5, maxLng: 4.5 },
  canary: { minLat: 27.5, maxLat: 29.5, minLng: -18.5, maxLng: -13.0 },
};

export function isInSpain(lat: number, lng: number): boolean {
  const { mainland, canary } = SPAIN_BOUNDS;
  return (
    (lat >= mainland.minLat && lat <= mainland.maxLat && lng >= mainland.minLng && lng <= mainland.maxLng) ||
    (lat >= canary.minLat && lat <= canary.maxLat && lng >= canary.minLng && lng <= canary.maxLng)
  );
}

// Minimum distance (in degrees) before we consider the position "changed enough" to sync.
const POSITION_CHANGE_THRESHOLD_DEG = 0.002; // ~200 m

// How often (ms) to re-sync position to the backend even if position did not change.
const SYNC_INTERVAL_MS = 5 * 60 * 1_000; // 5 minutes

function degreeDiff(a: number, b: number): number {
  return Math.abs(a - b);
}

/**
 * useGeolocation
 *
 * Exposes the device's current GPS position.  When the user is authenticated
 * (backendToken is present in the Zustand store) the hook also periodically
 * POSTs the position to /api/v1/location/update so the backend can derive the
 * current province for location-based alert delivery.
 *
 * Sync rules:
 *  - On first position fix, always sync.
 *  - After that, sync if position moved more than ~200 m OR 5 minutes have elapsed.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    isLoading: true,
    error: null,
  });

  const backendToken = useAppStore((s) => s.backendToken);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);

  // Track last synced position and time so we can decide whether a new sync is needed.
  const lastSyncedPos = useRef<{ lat: number; lon: number } | null>(null);
  const lastSyncedAt = useRef<number>(0);

  const syncToBackend = useCallback(
    async (lat: number, lon: number) => {
      if (!backendToken) return;

      try {
        const res = await fetch('/api/location/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            Authorization: `Bearer ${backendToken}`,
          },
          body: JSON.stringify({ lat, lon }),
        });

        if (res.ok) {
          const data = (await res.json()) as { province_code: string; distance_km: number };
          // Update the store so UI reflects the GPS-derived province.
          setProvinceCode(data.province_code);
          lastSyncedPos.current = { lat, lon };
          lastSyncedAt.current = Date.now();
        }
      } catch {
        // Network errors are non-fatal; silently ignore.
      }
    },
    [backendToken, setProvinceCode],
  );

  const maybeSync = useCallback(
    (lat: number, lon: number) => {
      const now = Date.now();
      const prev = lastSyncedPos.current;
      const timeSinceLastSync = now - lastSyncedAt.current;

      const positionChangedEnough =
        prev === null ||
        degreeDiff(lat, prev.lat) > POSITION_CHANGE_THRESHOLD_DEG ||
        degreeDiff(lon, prev.lon) > POSITION_CHANGE_THRESHOLD_DEG;

      const intervalElapsed = timeSinceLastSync >= SYNC_INTERVAL_MS;

      if (positionChangedEnough || intervalElapsed) {
        void syncToBackend(lat, lon);
      }
    },
    [syncToBackend],
  );

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, isLoading: false, error: 'not-supported' }));
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setState({ latitude, longitude, isLoading: false, error: null });
        maybeSync(latitude, longitude);
      },
      (err) => {
        setState({ latitude: null, longitude: null, isLoading: false, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }, [maybeSync]);

  useEffect(() => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- checking browser support on mount is intentional
      setState((s) => ({ ...s, isLoading: false, error: 'not-supported' }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setState({ latitude, longitude, isLoading: false, error: null });
        maybeSync(latitude, longitude);
      },
      (err) => {
        setState({ latitude: null, longitude: null, isLoading: false, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [maybeSync]);

  return { ...state, requestPermission };
}
