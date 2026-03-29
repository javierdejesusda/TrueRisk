'use client';
import { useState, useCallback, useEffect } from 'react';

export interface FireHotspot {
  lat: number;
  lon: number;
  brightness: number;
  confidence: string;
  frp: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
}

export function useFireHotspots() {
  const [data, setData] = useState<FireHotspot[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data/fire-hotspots');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    let id = setInterval(refresh, 600_000);

    function onVisibilityChange() {
      if (document.hidden) {
        clearInterval(id);
      } else {
        refresh();
        id = setInterval(refresh, 600_000);
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
