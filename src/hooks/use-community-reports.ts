'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

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
  created_at: string;
  expires_at: string;
}

export interface CreateReportData {
  province_code: string;
  hazard_type: 'flood' | 'road_blocked' | 'power_outage' | 'structural_damage' | 'other';
  severity: number;
  latitude: number;
  longitude: number;
  description?: string;
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
    const res = await fetch('/api/community/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const report = await res.json() as CommunityReport;
    setReports((prev) => [report, ...prev]);
    return report;
  }, []);

  const upvoteReport = useCallback(async (reportId: number) => {
    const res = await fetch(`/api/community/reports/${reportId}/upvote`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated = await res.json() as CommunityReport;
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
  }, []);

  return { reports, isLoading, error, fetchReports, submitReport, upvoteReport };
}
