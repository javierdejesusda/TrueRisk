'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ────────────────────────────────────────────────────────────────

interface WeatherRecord {
  id: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number | null;
  pressure: number | null;
  risk_score: number | null;
  is_disaster: boolean;
  recorded_at: string;
}

type SortField =
  | 'recorded_at'
  | 'temperature'
  | 'precipitation'
  | 'humidity'
  | 'wind_speed'
  | 'pressure'
  | 'risk_score';
type SortDir = 'asc' | 'desc';

// ── Component ────────────────────────────────────────────────────────────

export default function BackofficeRecordsPage() {
  const t = useTranslations('Backoffice');
  const [records, setRecords] = useState<WeatherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<SortField>('recorded_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/weather/history?${params.toString()}`);
      const json = await res.json();

      if (res.ok) {
        const data = json;
        setRecords(data.items ?? data);
        setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
      }
    } catch (err) {
      setError('Failed to load weather records. Please try again.');
      console.error('fetchRecords:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Client-side sorting
  const sorted = [...records].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;

    if (sortField === 'recorded_at') {
      const dateA = new Date(valA as string).getTime();
      const dateB = new Date(valB as string).getTime();
      return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
    }

    return sortDir === 'asc'
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number);
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function riskColor(score: number | null): string {
    if (score === null) return 'text-text-muted';
    if (score >= 80) return 'text-accent-red';
    if (score >= 60) return 'text-accent-yellow';
    if (score >= 40) return 'text-accent-blue';
    return 'text-accent-green';
  }

  function exportCsv() {
    const headers = [
      'Date',
      'Temperature',
      'Precipitation',
      'Humidity',
      'Wind Speed',
      'Pressure',
      'Risk Score',
      'Disaster',
    ];

    const rows = records.map((r) => [
      new Date(r.recorded_at).toISOString(),
      r.temperature.toFixed(1),
      r.precipitation.toFixed(1),
      r.humidity.toFixed(1),
      r.wind_speed?.toFixed(1) ?? '',
      r.pressure?.toFixed(1) ?? '',
      r.risk_score?.toFixed(1) ?? '',
      r.is_disaster ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-records-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / pageSize);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function SortIndicator({ field }: { field: SortField }) {
    if (sortField !== field) {
      return (
        <span className="ml-1 text-text-muted opacity-40">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M6 2l3 4H3zM6 10l-3-4h6z" />
          </svg>
        </span>
      );
    }
    return (
      <span className="ml-1 text-accent-green">
        {sortDir === 'asc' ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M6 2l3 4H3z" />
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M6 10l-3-4h6z" />
          </svg>
        )}
      </span>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-7xl space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
            {t('weatherRecords')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-[family-name:var(--font-sans)]">
            {t('weatherRecordsSubtitle', { total: String(total) })}
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={isLoading}>
          {t('exportCsv')}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-center justify-between">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => { setError(null); fetchRecords(); }}
            className="text-sm text-red-300 hover:text-red-200 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider"
                  onClick={() => toggleSort('recorded_at')}
                >
                  <span className="inline-flex items-center">
                    {t('date')}
                    <SortIndicator field="recorded_at" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider"
                  onClick={() => toggleSort('temperature')}
                >
                  <span className="inline-flex items-center">
                    {t('temp')}
                    <SortIndicator field="temperature" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider"
                  onClick={() => toggleSort('precipitation')}
                >
                  <span className="inline-flex items-center">
                    {t('precip')}
                    <SortIndicator field="precipitation" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider"
                  onClick={() => toggleSort('humidity')}
                >
                  <span className="inline-flex items-center">
                    {t('humidity')}
                    <SortIndicator field="humidity" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider"
                  onClick={() => toggleSort('wind_speed')}
                >
                  <span className="inline-flex items-center">
                    {t('wind')}
                    <SortIndicator field="wind_speed" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider"
                  onClick={() => toggleSort('pressure')}
                >
                  <span className="inline-flex items-center">
                    {t('pressure')}
                    <SortIndicator field="pressure" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider"
                  onClick={() => toggleSort('risk_score')}
                >
                  <span className="inline-flex items-center">
                    {t('riskScore')}
                    <SortIndicator field="risk_score" />
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary font-[family-name:var(--font-sans)] text-[11px] uppercase tracking-wider">
                  {t('disaster')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton width="60px" height="16px" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-text-muted"
                  >
                    {t('noRecordsFound')}
                  </td>
                </tr>
              ) : (
                sorted.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-border/50 transition-colors hover:bg-bg-card/50"
                  >
                    <td className="px-4 py-3 text-text-primary whitespace-nowrap font-[family-name:var(--font-mono)] text-[11px]">
                      {formatDate(record.recorded_at)}
                    </td>
                    <td className="px-4 py-3 text-text-primary font-[family-name:var(--font-mono)] text-[11px]">
                      {record.temperature.toFixed(1)}°C
                    </td>
                    <td className="px-4 py-3 text-text-primary font-[family-name:var(--font-mono)] text-[11px]">
                      {record.precipitation.toFixed(1)} mm
                    </td>
                    <td className="px-4 py-3 text-text-primary font-[family-name:var(--font-mono)] text-[11px]">
                      {record.humidity.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-[family-name:var(--font-mono)] text-[11px]">
                      {record.wind_speed?.toFixed(1) ?? 'N/A'} km/h
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-[family-name:var(--font-mono)] text-[11px]">
                      {record.pressure?.toFixed(1) ?? 'N/A'} hPa
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold font-[family-name:var(--font-mono)] ${riskColor(record.risk_score)}`}
                      >
                        {record.risk_score?.toFixed(1) ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {record.is_disaster ? (
                        <Badge variant="danger" size="sm" pulse>
                          {t('yes')}
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          {t('no')}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-text-muted font-[family-name:var(--font-mono)] text-[11px]">
              {t('pageOf', { page: String(page), totalPages: String(totalPages) })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('previous')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
