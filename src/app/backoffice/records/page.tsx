'use client';

import { useState, useEffect, useCallback } from 'react';
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
  windSpeed: number | null;
  pressure: number | null;
  riskScore: number | null;
  isDisaster: boolean;
  recordedAt: string;
}

type SortField =
  | 'recordedAt'
  | 'temperature'
  | 'precipitation'
  | 'humidity'
  | 'windSpeed'
  | 'pressure'
  | 'riskScore';
type SortDir = 'asc' | 'desc';

// ── Component ────────────────────────────────────────────────────────────

export default function BackofficeRecordsPage() {
  const [records, setRecords] = useState<WeatherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<SortField>('recordedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const pageSize = 20;

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/weather/history?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setRecords(json.data.items);
        setTotal(json.data.total);
      }
    } catch {
      // ignore
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

    if (sortField === 'recordedAt') {
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
      new Date(r.recordedAt).toISOString(),
      r.temperature.toFixed(1),
      r.precipitation.toFixed(1),
      r.humidity.toFixed(1),
      r.windSpeed?.toFixed(1) ?? '',
      r.pressure?.toFixed(1) ?? '',
      r.riskScore?.toFixed(1) ?? '',
      r.isDisaster ? 'Yes' : 'No',
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
          <h1 className="text-2xl font-bold text-text-primary">
            Weather Records
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Historical weather data and risk assessments ({total} records)
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={isLoading}>
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary"
                  onClick={() => toggleSort('recordedAt')}
                >
                  <span className="inline-flex items-center">
                    Date
                    <SortIndicator field="recordedAt" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary"
                  onClick={() => toggleSort('temperature')}
                >
                  <span className="inline-flex items-center">
                    Temp
                    <SortIndicator field="temperature" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary"
                  onClick={() => toggleSort('precipitation')}
                >
                  <span className="inline-flex items-center">
                    Precip
                    <SortIndicator field="precipitation" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary"
                  onClick={() => toggleSort('humidity')}
                >
                  <span className="inline-flex items-center">
                    Humidity
                    <SortIndicator field="humidity" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary"
                  onClick={() => toggleSort('windSpeed')}
                >
                  <span className="inline-flex items-center">
                    Wind
                    <SortIndicator field="windSpeed" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary"
                  onClick={() => toggleSort('pressure')}
                >
                  <span className="inline-flex items-center">
                    Pressure
                    <SortIndicator field="pressure" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-text-secondary hover:text-text-primary"
                  onClick={() => toggleSort('riskScore')}
                >
                  <span className="inline-flex items-center">
                    Risk Score
                    <SortIndicator field="riskScore" />
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  Disaster
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
                    No weather records found
                  </td>
                </tr>
              ) : (
                sorted.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-border/50 transition-colors hover:bg-bg-card/50"
                  >
                    <td className="px-4 py-3 text-text-primary whitespace-nowrap">
                      {formatDate(record.recordedAt)}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {record.temperature.toFixed(1)}°C
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {record.precipitation.toFixed(1)} mm
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {record.humidity.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {record.windSpeed?.toFixed(1) ?? 'N/A'} km/h
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {record.pressure?.toFixed(1) ?? 'N/A'} hPa
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${riskColor(record.riskScore)}`}
                      >
                        {record.riskScore?.toFixed(1) ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {record.isDisaster ? (
                        <Badge variant="danger" size="sm" pulse>
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          No
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
            <p className="text-sm text-text-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
