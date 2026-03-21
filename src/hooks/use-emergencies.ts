'use client';
import { useState, useCallback, useEffect } from 'react';

export interface EmergencyData {
  title: string;
  description: string;
  link?: string;
  published?: string;
  [key: string]: unknown;
}

export function useEmergencies() {
  const [data, setData] = useState<EmergencyData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data/emergencies');
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
    const id = setInterval(refresh, 900_000); // 15min
    return () => clearInterval(id);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
