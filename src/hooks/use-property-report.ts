'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { save, get } from '@/lib/offline-storage';
import type { PropertyReportResponse, PropertyReportListItem } from '@/types/property';

export function usePropertyReport(reportId: string) {
  const [report, setReport] = useState<PropertyReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!reportId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/property/report/${reportId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as PropertyReportResponse;
      setReport(data);
      setError(null);
      save('propertyReports', reportId, data);
    } catch (err) {
      const cached = await get<PropertyReportResponse>('propertyReports', reportId);
      if (cached) {
        setReport(cached);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch property report');
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) fetchData();
  }, [reportId, fetchData]);

  return { report, isLoading, error, refresh: fetchData };
}

export function useCreateReport() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendToken = useAppStore((s) => s.backendToken);

  const createReport = useCallback(async (address: string): Promise<string> => {
    setIsCreating(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (backendToken) {
        headers['Authorization'] = `Bearer ${backendToken}`;
      }
      const res = await fetch('/api/property/report', {
        method: 'POST',
        headers,
        body: JSON.stringify({ address }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as PropertyReportResponse;
      return data.report_id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create report';
      setError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [backendToken]);

  return { createReport, isCreating, error };
}

export function useReportHistory() {
  const backendToken = useAppStore((s) => s.backendToken);
  const [reports, setReports] = useState<PropertyReportListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!backendToken) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/property/reports?page=1&per_page=20', {
        headers: { Authorization: `Bearer ${backendToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as PropertyReportListItem[];
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report history');
    } finally {
      setIsLoading(false);
    }
  }, [backendToken]);

  useEffect(() => {
    if (backendToken) {
      fetchData();
    } else {
      setReports([]);
      setIsLoading(false);
    }
  }, [backendToken, fetchData]);

  return { reports, isLoading, error };
}
