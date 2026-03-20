'use client';

import { useState, useEffect } from 'react';

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

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- checking browser support on mount is intentional
      setState((s) => ({ ...s, isLoading: false, error: 'not-supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          isLoading: false,
          error: null,
        });
      },
      (err) => {
        setState({ latitude: null, longitude: null, isLoading: false, error: err.message });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }, []);

  return state;
}
