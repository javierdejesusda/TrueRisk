'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { apiFetch } from '@/lib/api-client';

export interface CommunityReport {
  id: number;
  province_code: string;
  hazard_type: string;
  severity: number;
  latitude: number;
  longitude: number;
  description: string | null;
  status: string;
  upvotes: number;
  photo_url: string | null;
  urgency: number;
  verified_count: number;
  is_verified: boolean;
  reporter_user_id: number | null;
  created_at: string;
  expires_at: string;
}

export interface CreateReportData {
  province_code: string;
  hazard_type: 'flood' | 'road_blocked' | 'power_outage' | 'structural_damage' | 'other' | 'people_trapped' | 'fire' | 'landslide' | 'missing_person' | 'medical_emergency';
  severity: number;
  urgency?: number;
  latitude: number;
  longitude: number;
  description?: string;
  photo_url?: string;
}

export function useCommunityReports(provinceCode?: string) {
  const storeCode = useAppStore((s) => s.provinceCode);
  const code = provinceCode ?? storeCode;
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (code) params.set('province', code);
      const res = await fetch(`/api/community/reports?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as CommunityReport[];
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const submitReport = useCallback(async (data: CreateReportData) => {
    const res = await apiFetch('/api/community/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const report = await res.json() as CommunityReport;
    setReports((prev) => [report, ...prev]);
    return report;
  }, []);

  const verifyReport = useCallback(async (reportId: number) => {
    const res = await apiFetch(`/api/community/reports/${reportId}/verify`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated = await res.json() as CommunityReport;
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
  }, []);

  const upvoteReport = useCallback(async (reportId: number) => {
    const res = await apiFetch(`/api/community/reports/${reportId}/upvote`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated = await res.json() as CommunityReport;
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
  }, []);

  return { reports, isLoading, error, fetchReports, submitReport, upvoteReport, verifyReport };
}
