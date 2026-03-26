'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { apiFetch } from '@/lib/api-client';

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

export function useSafetyCheck() {
  const token = useAppStore((s) => s.backendToken);
  const [familyStatus, setFamilyStatus] = useState<FamilyMemberStatus[]>([]);
  const [checkIns, setCheckIns] = useState<SafetyCheckIn[]>([]);
  const [pendingLinks, setPendingLinks] = useState<FamilyLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkIn = useCallback(async (status: SafetyStatus, message?: string, latitude?: number, longitude?: number) => {
    try {
      const body: Record<string, unknown> = { status };
      if (message) body.message = message;
      if (latitude !== undefined) body.latitude = latitude;
      if (longitude !== undefined) body.longitude = longitude;

      const res = await apiFetch('/api/safety/check-in', {
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
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/safety/family-status');
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
    try {
      const body: Record<string, string> = { nickname };
      if (relationship) body.relationship = relationship;

      const res = await apiFetch('/api/safety/links', {
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
    try {
      const res = await apiFetch(`/api/safety/links/${linkId}/accept`, {
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
    try {
      const res = await apiFetch(`/api/safety/links/${linkId}`, {
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
    try {
      const res = await apiFetch(`/api/safety/request/${userId}`, {
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
    try {
      const res = await apiFetch('/api/safety/check-ins?limit=20');
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
    try {
      const res = await apiFetch('/api/safety/links');
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

  // Initial fetch
  useEffect(() => {
    if (token) {
      getFamilyStatus();
      fetchCheckIns();
      fetchPendingLinks();
    }
  }, [token, getFamilyStatus, fetchCheckIns, fetchPendingLinks]);

  // Auto-refresh family status every 30 seconds
  useEffect(() => {
    if (!token) return;

    intervalRef.current = setInterval(() => {
      apiFetch('/api/safety/family-status')
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
