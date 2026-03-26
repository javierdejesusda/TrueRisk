'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { useAppStore } from '@/store/app-store';

export interface GamificationBadge {
  key: string;
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  icon: string;
  earned: boolean;
  earned_at: string | null;
}

export interface GamificationStatus {
  total_points: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_active_date: string | null;
  badges: GamificationBadge[];
}

export function useGamification() {
  const backendToken = useAppStore((s) => s.backendToken);
  const { status: sessionStatus } = useSession();
  const isAuthResolved = sessionStatus !== 'loading';
  const [status, setStatus] = useState<GamificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!backendToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await apiFetch('/api/gamification/status');
      if (res.ok) {
        const data = (await res.json()) as GamificationStatus;
        setStatus(data);
      } else {
        setError('Failed to fetch gamification status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setIsLoading(false);
    }
  }, [backendToken]);

  useEffect(() => {
    if (!isAuthResolved) return; // Wait for auth to resolve
    fetchStatus();
  }, [fetchStatus, isAuthResolved]);

  return { status, isLoading, error, refresh: fetchStatus };
}
