'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/app-store';

export type SafetyStatus = 'safe' | 'need_help' | 'evacuating' | 'sheltering';

export interface SafetyCheckIn {
  id: number;
  user_id: number;
  province_code: string;
  latitude: number | null;
  longitude: number | null;
  status: SafetyStatus;
  message: string | null;
  checked_in_at: string;
  expires_at: string;
}

export interface FamilyLink {
  id: number;
  user_id: number;
  linked_user_id: number;
  relationship: string;
  status: string;
  created_at: string;
  linked_user_nickname: string;
  linked_user_display_name: string | null;
}

export interface FamilyMemberStatus {
  user_id: number;
  link_id: number;
  nickname: string;
  display_name: string | null;
  latest_check_in: SafetyCheckIn | null;
  relationship: string;
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

export function useSafetyCheck() {
  const { data: session, status: sessionStatus } = useSession();
  const storeToken = useAppStore((s) => s.backendToken);
  // Use session token as fallback when Zustand store hasn't hydrated yet
  const token = storeToken || (session as Record<string, unknown> | null)?.backendToken as string | null;
  const isAuthResolved = sessionStatus !== 'loading';
  const [familyStatus, setFamilyStatus] = useState<FamilyMemberStatus[]>([]);
  const [checkIns, setCheckIns] = useState<SafetyCheckIn[]>([]);
  const [pendingLinks, setPendingLinks] = useState<FamilyLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a ref so callback closures always see the latest resolved token
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const checkIn = useCallback(async (status: SafetyStatus, message?: string, latitude?: number, longitude?: number) => {
    const currentToken = tokenRef.current;
    if (!currentToken) return undefined as unknown as SafetyCheckIn;
    try {
      const body: Record<string, unknown> = { status };
      if (message) body.message = message;
      if (latitude !== undefined) body.latitude = latitude;
      if (longitude !== undefined) body.longitude = longitude;

      const res = await authFetch('/api/safety/check-in', currentToken, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        if (res.status === 401) { setError('auth_required'); return undefined as unknown as SafetyCheckIn; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json() as SafetyCheckIn;
      setCheckIns((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in');
      throw err;
    }
  }, []);

  const getFamilyStatus = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      setIsLoading(true);
      const res = await authFetch('/api/safety/family-status', currentToken);
      if (!res.ok) {
        if (res.status === 401) { setError('auth_required'); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json() as FamilyMemberStatus[];
      setFamilyStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch family status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLink = useCallback(async (nickname: string, relationship?: string) => {
    const currentToken = tokenRef.current;
    if (!currentToken) return undefined as unknown as FamilyLink;
    try {
      const body: Record<string, string> = { nickname };
      if (relationship) body.relationship = relationship;

      const res = await authFetch('/api/safety/links', currentToken, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        if (res.status === 401) { setError('auth_required'); return undefined as unknown as FamilyLink; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json() as FamilyLink;
      if (data.status === 'pending') {
        setPendingLinks((prev) => [...prev, data]);
      }
      await getFamilyStatus();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
      throw err;
    }
  }, [getFamilyStatus]);

  const acceptLink = useCallback(async (linkId: number) => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      const res = await authFetch(`/api/safety/links/${linkId}/accept`, currentToken, {
        method: 'PATCH',
      });
      if (!res.ok) {
        if (res.status === 401) { setError('auth_required'); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      setPendingLinks((prev) => prev.filter((link) => link.id !== linkId));
      await getFamilyStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept link');
      throw err;
    }
  }, [getFamilyStatus]);

  const deleteLink = useCallback(async (linkId: number) => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      const res = await authFetch(`/api/safety/links/${linkId}`, currentToken, {
        method: 'DELETE',
      });
      if (!res.ok) {
        if (res.status === 401) { setError('auth_required'); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      await getFamilyStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link');
      throw err;
    }
  }, [getFamilyStatus]);

  const requestCheckIn = useCallback(async (userId: number) => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      const res = await authFetch(`/api/safety/request/${userId}`, currentToken, {
        method: 'POST',
      });
      if (!res.ok) {
        if (res.status === 401) { setError('auth_required'); return; }
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request check-in');
      throw err;
    }
  }, []);

  const fetchCheckIns = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      const res = await authFetch('/api/safety/check-ins?limit=20', currentToken);
      if (!res.ok) {
        if (res.status === 401) { setError('auth_required'); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json() as SafetyCheckIn[];
      setCheckIns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch check-ins');
    }
  }, []);

  const fetchPendingLinks = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      const res = await authFetch('/api/safety/links', currentToken);
      if (!res.ok) {
        if (res.status === 401) { setError('auth_required'); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json() as FamilyLink[];
      setPendingLinks(data);
    } catch {
      // silent - pending links are supplementary
    }
  }, []);

  // Initial fetch — wait for auth to resolve before deciding state
  useEffect(() => {
    if (!isAuthResolved) return; // Auth still loading, wait
    if (!token) {
      // Auth resolved but no token — user is genuinely not logged in
      setError('auth_required');
      return;
    }
    // Token is available — clear any stale error and fetch data
    setError(null);
    getFamilyStatus();
    fetchCheckIns();
    fetchPendingLinks();
  }, [token, isAuthResolved, getFamilyStatus, fetchCheckIns, fetchPendingLinks]);

  // Auto-refresh family status every 30 seconds
  useEffect(() => {
    if (!token) return;

    intervalRef.current = setInterval(() => {
      const currentToken = tokenRef.current;
      if (!currentToken) return;
      authFetch('/api/safety/family-status', currentToken)
        .then((res) => {
          if (res.ok) return res.json();
        })
        .then((data) => {
          if (data) setFamilyStatus(data as FamilyMemberStatus[]);
        })
        .catch(() => {
          // silent refresh failure
        });
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token]);

  return {
    familyStatus,
    checkIns,
    pendingLinks,
    isLoading,
    error,
    checkIn,
    getFamilyStatus,
    fetchCheckIns,
    createLink,
    acceptLink,
    deleteLink,
    requestCheckIn,
  };
}
