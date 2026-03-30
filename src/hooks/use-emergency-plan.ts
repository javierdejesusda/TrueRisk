'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAppStore } from '@/store/app-store';

export interface HouseholdMember {
  name: string;
  age: number | null;
  needs: string | null;
  medications: string | null;
}

export interface MeetingPoint {
  name: string;
  address: string | null;
  lat: number | null;
  lon: number | null;
  notes: string | null;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  role: string | null;
  priority: number;
}

export interface EmergencyPlan {
  id: number;
  household_members: HouseholdMember[];
  meeting_points: MeetingPoint[];
  communication_plan: EmergencyContact[];
  evacuation_notes: string | null;
  insurance_info: Record<string, string> | null;
  pet_info: Record<string, string>[] | null;
  important_documents: Record<string, string>[] | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmergencyPlan() {
  const [plan, setPlan] = useState<EmergencyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kit recommendations streaming
  const [kitContent, setKitContent] = useState('');
  const [isStreamingKit, setIsStreamingKit] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPlan = useCallback(async () => {
    const token = useAppStore.getState().backendToken;
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/emergency-plan');
      if (res.status === 401) {
        setIsLoading(false);
        return;
      }
      if (res.status === 404) {
        // No plan yet — start fresh
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as EmergencyPlan;
      setPlan(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const updatePlan = useCallback(async (data: Partial<EmergencyPlan>) => {
    const token = useAppStore.getState().backendToken;
    if (!token) {
      setError('Sign in to save your emergency plan');
      return null;
    }
    try {
      const res = await apiFetch('/api/emergency-plan', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (res.status === 401) {
        setError('Session expired — please sign in again');
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json() as EmergencyPlan;
      setPlan(updated);
      setError(null);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
      return null;
    }
  }, []);

  const streamKitRecs = useCallback(async () => {
    abortRef.current?.abort();
    setKitContent('');
    setIsStreamingKit(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const locale = useAppStore.getState().locale;
    const token = useAppStore.getState().backendToken;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(
        `/api/emergency-plan/kit-recommendations?locale=${locale}`,
        { headers, signal: controller.signal },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].replace(/\r$/, '');
          if (line.startsWith('event: done')) {
            setIsStreamingKit(false);
            reader.cancel();
            return;
          }
          if (line.startsWith('event: error')) {
            setIsStreamingKit(false);
            reader.cancel();
            return;
          }
          if (line === 'data: ' || line === 'data:') {
            setKitContent((prev) => prev + '\n');
          } else if (line.startsWith('data: ')) {
            setKitContent((prev) => prev + line.slice(6));
          }
        }
      }

      setIsStreamingKit(false);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setIsStreamingKit(false);
      }
    }
  }, []);

  return { plan, isLoading, error, updatePlan, fetchPlan, kitContent, isStreamingKit, streamKitRecs };
}
