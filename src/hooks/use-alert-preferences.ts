'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

export interface AlertPreferences {
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  emergency_override: boolean;
  batch_interval_minutes: number;
  escalation_enabled: boolean;
  snoozed_hazards: Record<string, string>;
}

export interface AlertExplanation {
  alert_id: number;
  reason: string;
  relevance_score: number;
  factors: string[];
}

export function useAlertPreferences() {
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/alerts/preferences');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as AlertPreferences;
      setPreferences(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(async (data: Partial<AlertPreferences>) => {
    try {
      const res = await apiFetch('/api/alerts/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json() as AlertPreferences;
      setPreferences(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
      throw err;
    }
  }, []);

  const explainAlert = useCallback(async (alertId: number): Promise<AlertExplanation | null> => {
    try {
      const res = await apiFetch(`/api/alerts/${alertId}/explain`);
      if (!res.ok) return null;
      return await res.json() as AlertExplanation;
    } catch {
      return null;
    }
  }, []);

  const markRead = useCallback(async (alertId: number) => {
    await apiFetch(`/api/alerts/${alertId}/read`, { method: 'POST' });
  }, []);

  return { preferences, isLoading, error, updatePreferences, explainAlert, markRead, refresh: fetchPreferences };
}
