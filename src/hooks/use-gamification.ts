'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
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

/** Helper: fetch with explicit Bearer token (avoids Zustand hydration race) */
function authFetch(path: string, token: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(path, { ...options, headers });
}

export function useGamification() {
  const storeToken = useAppStore((s) => s.backendToken);
  const { data: session, status: sessionStatus } = useSession();
  // Use session token as fallback when Zustand store hasn't hydrated yet
  const backendToken = storeToken || (session as Record<string, unknown> | null)?.backendToken as string | null;
  const isAuthResolved = sessionStatus !== 'loading';
  const [status, setStatus] = useState<GamificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref so callback closures always see the latest resolved token
  const tokenRef = useRef(backendToken);
  tokenRef.current = backendToken;

  const fetchStatus = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await authFetch('/api/gamification/status', currentToken);
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
