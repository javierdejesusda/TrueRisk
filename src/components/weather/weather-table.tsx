'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

interface WeatherTableProps {
  records: WeatherRecord[];
  isLoading: boolean;
}

type SortKey = keyof Pick<
  WeatherRecord,
  | 'recordedAt'
  | 'temperature'
  | 'precipitation'
  | 'humidity'
  | 'windSpeed'
  | 'pressure'
  | 'riskScore'
>;

type SortDirection = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'recordedAt', label: 'Date/Time' },
  { key: 'temperature', label: 'Temp (\u00B0C)' },
  { key: 'precipitation', label: 'Precip (mm)' },
  { key: 'humidity', label: 'Humidity (%)' },
  { key: 'windSpeed', label: 'Wind (km/h)' },
  { key: 'pressure', label: 'Pressure (hPa)' },
  { key: 'riskScore', label: 'Risk Score' },
];

function riskBadge(score: number | null) {
  if (score === null) {
    return <Badge variant="neutral" size="sm">N/A</Badge>;
  }
  if (score < 30) {
    return <Badge variant="success" size="sm">{score.toFixed(0)}</Badge>;
  }
  if (score < 60) {
    return <Badge variant="warning" size="sm">{score.toFixed(0)}</Badge>;
  }
  return <Badge variant="danger" size="sm">{score.toFixed(0)}</Badge>;
}

function rowRiskClass(score: number | null): string {
  if (score === null) return '';
  if (score < 30) return 'bg-accent-green/[0.03]';
  if (score < 60) return 'bg-accent-yellow/[0.05]';
  return 'bg-accent-red/[0.06]';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WeatherTable({ records, isLoading }: WeatherTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('recordedAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const sorted = useMemo(() => {
    const copy = [...records];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (sortKey === 'recordedAt') {
        const diff =
          new Date(aVal as string).getTime() -
          new Date(bVal as string).getTime();
        return sortDir === 'asc' ? diff : -diff;
      }

      const diff = (aVal as number) - (bVal as number);
      return sortDir === 'asc' ? diff : -diff;
    });
    return copy;
  }, [records, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <Skeleton className="mb-4" width="140px" height="18px" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="40px" />
          ))}
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-bg-card p-5">
        <p className="text-sm text-text-muted">
          No weather records found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-border">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                {sortIndicator(col.key)}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">
              Disaster
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((record) => (
            <tr
              key={record.id}
              className={[
                'border-b border-border/50 transition-colors hover:bg-bg-card-hover',
                rowRiskClass(record.riskScore),
              ].join(' ')}
            >
              <td className="px-4 py-2.5 text-text-primary">
                {formatDate(record.recordedAt)}
              </td>
              <td className="px-4 py-2.5 text-text-primary">
                {record.temperature.toFixed(1)}
              </td>
              <td className="px-4 py-2.5 text-text-primary">
                {record.precipitation.toFixed(1)}
              </td>
              <td className="px-4 py-2.5 text-text-primary">
                {record.humidity.toFixed(1)}
              </td>
              <td className="px-4 py-2.5 text-text-primary">
                {record.windSpeed !== null
                  ? record.windSpeed.toFixed(1)
                  : '\u2014'}
              </td>
              <td className="px-4 py-2.5 text-text-primary">
                {record.pressure !== null
                  ? record.pressure.toFixed(1)
                  : '\u2014'}
              </td>
              <td className="px-4 py-2.5">
                {riskBadge(record.riskScore)}
              </td>
              <td className="px-4 py-2.5">
                {record.isDisaster ? (
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-accent-red" />
                ) : (
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-accent-green" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
