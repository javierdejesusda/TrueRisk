'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { save, get } from '@/lib/offline-storage';
import { useAppStore } from '@/store/app-store';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { apiFetch } from '@/lib/api-client';

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const LAST_SYNC_KEY = 'offlinePack:lastSync';

const DEFAULT_EMERGENCY_CONTACTS = [
  { name: 'General Emergency', number: '112' },
  { name: 'Guardia Civil', number: '062' },
  { name: 'Fire Department', number: '080' },
  { name: 'National Police', number: '091' },
];

interface OfflinePack {
  riskScores: unknown | undefined;
  alerts: unknown | undefined;
  weather: unknown | undefined;
  emergencyContacts: typeof DEFAULT_EMERGENCY_CONTACTS | undefined;
}

export function useOfflinePack() {
  const { isOffline } = useOfflineStatus();
  const provinceCode = useAppStore((s) => s.provinceCode);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [offlinePackReady, setOfflinePackReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read persisted sync timestamp on mount
  useEffect(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating client-only state on mount is intentional
    if (stored) setLastSyncedAt(stored);
  }, []);

  const syncOfflinePack = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    // Fetch & cache risk scores
    try {
      const res = await apiFetch('/api/risk/all');
      if (res.ok) {
        const data = await res.json();
        await save('riskScores', 'latest', data);
      }
    } catch {
      // best-effort
    }

    // Fetch & cache active alerts
    try {
      const res = await apiFetch('/api/alerts?active=true');
      if (res.ok) {
        const data = await res.json();
        await save('alerts', 'latest', data);
      }
    } catch {
      // best-effort
    }

    // Fetch & cache weather for user's province
    try {
      const res = await apiFetch(`/api/weather/current/${provinceCode}`);
      if (res.ok) {
        const data = await res.json();
        await save('weather', provinceCode, data);
      }
    } catch {
      // best-effort
    }

    // Cache default emergency contacts (static, not from API)
    try {
      await save('emergencyContacts', 'default', DEFAULT_EMERGENCY_CONTACTS);
    } catch {
      // best-effort
    }

    // Record sync timestamp
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, now);
    setLastSyncedAt(now);
    setOfflinePackReady(true);
  }, [provinceCode]);

  const getOfflinePack = useCallback(async (): Promise<OfflinePack> => {
    const riskScores = await get('riskScores', 'latest');
    const alerts = await get('alerts', 'latest');
    const weather = await get('weather', provinceCode);
    const emergencyContacts = await get<typeof DEFAULT_EMERGENCY_CONTACTS>(
      'emergencyContacts',
      'default',
    );

    return { riskScores, alerts, weather, emergencyContacts };
  }, [provinceCode]);

  // Auto-sync on mount (once) and set up 30-min interval
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync sets state asynchronously after fetch completes
    syncOfflinePack();

    intervalRef.current = setInterval(() => {
      syncOfflinePack();
    }, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [syncOfflinePack]);

  return { syncOfflinePack, getOfflinePack, lastSyncedAt, offlinePackReady, isOffline };
}
