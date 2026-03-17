'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WeatherChart } from '@/components/weather/weather-chart';
import { WeatherTable } from '@/components/weather/weather-table';

// ── Types ──────────────────────────────────────────────────────────

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

interface Consultation {
  id: number;
  userId: number;
  systemPrompt: string;
  userPrompt: string;
  llmResponse: string;
  riskScore: number | null;
  createdAt: string;
}

type ActiveTab = 'weather' | 'consultations';

// ── Component ──────────────────────────────────────────────────────

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('weather');

  return (
    <motion.div
      className="min-h-screen bg-bg-primary px-4 py-8 sm:px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 text-2xl font-bold text-text-primary">History</h1>
        <p className="mb-6 text-sm text-text-muted">
          Weather records and past consultations.
        </p>

        {/* Tab bar */}
        <div className="mb-6 flex gap-6 border-b border-border">
          <TabButton
            label="Weather Records"
            active={activeTab === 'weather'}
            onClick={() => setActiveTab('weather')}
          />
          <TabButton
            label="Consultations"
            active={activeTab === 'consultations'}
            onClick={() => setActiveTab('consultations')}
          />
        </div>

        {activeTab === 'weather' ? (
          <WeatherTab />
        ) : (
          <ConsultationsTab />
        )}
      </div>
    </motion.div>
  );
}

// ── Tab button ─────────────────────────────────────────────────────

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative cursor-pointer pb-3 text-sm font-medium transition-colors',
        active
          ? 'text-accent-green'
          : 'text-text-muted hover:text-text-secondary',
      ].join(' ')}
    >
      {label}
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent-green" />
      )}
    </button>
  );
}

// ── Weather Tab ────────────────────────────────────────────────────

function WeatherTab() {
  const [records, setRecords] = useState<WeatherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchRecords = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/weather/history?page=${p}&pageSize=${pageSize}`,
      );
      const json = await res.json();
      if (json.success && json.data) {
        setRecords(json.data.items);
        setTotal(json.data.total);
        setPage(json.data.page);
      }
    } catch {
      // silently handle - data will remain empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  const chartData = [...records]
    .reverse()
    .map((r) => ({
      time: new Date(r.recordedAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      temperature: r.temperature,
      precipitation: r.precipitation,
      humidity: r.humidity,
    }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {total} record{total !== 1 ? 's' : ''} total
        </p>
        <Button
          variant="outline"
          size="sm"
          loading={isLoading}
          onClick={() => fetchRecords(page)}
        >
          Refresh
        </Button>
      </div>

      <WeatherChart data={chartData} isLoading={isLoading} />
      <WeatherTable records={records} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => fetchRecords(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => fetchRecords(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Consultations Tab ──────────────────────────────────────────────

function ConsultationsTab() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/consultations?userId=me');
        const json = await res.json();
        if (json.success && json.data) {
          const items = Array.isArray(json.data) ? json.data : json.data.items ?? [];
          setConsultations(items);
        }
      } catch {
        // silently handle
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <Skeleton width="40%" height="16px" className="mb-2" />
            <Skeleton width="100%" height="14px" />
          </Card>
        ))}
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-bg-card">
        <p className="text-sm text-text-muted">
          No past consultations found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {consultations.map((c) => {
        const isExpanded = expandedId === c.id;
        const truncated =
          c.llmResponse.length > 150
            ? c.llmResponse.slice(0, 150) + '...'
            : c.llmResponse;

        return (
          <Card key={c.id} hoverable padding="none">
            <button
              type="button"
              className="w-full cursor-pointer px-5 py-4 text-left"
              onClick={() => setExpandedId(isExpanded ? null : c.id)}
            >
              <div className="mb-1 flex items-center gap-3">
                <span className="text-xs text-text-muted">
                  {new Date(c.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {c.riskScore !== null && (
                  <Badge
                    variant={
                      c.riskScore < 30
                        ? 'success'
                        : c.riskScore < 60
                          ? 'warning'
                          : 'danger'
                    }
                    size="sm"
                  >
                    Risk: {c.riskScore.toFixed(0)}
                  </Badge>
                )}
                <span className="ml-auto text-xs text-text-muted">
                  {isExpanded ? '\u25B2' : '\u25BC'}
                </span>
              </div>
              {!isExpanded && (
                <p className="text-sm text-text-secondary">{truncated}</p>
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-border px-5 py-4">
                <div className="mb-4">
                  <h4 className="mb-1 text-xs font-medium text-text-muted uppercase">
                    Recommendation
                  </h4>
                  <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                    {c.llmResponse}
                  </p>
                </div>
                <div className="mb-3">
                  <h4 className="mb-1 text-xs font-medium text-text-muted uppercase">
                    System Prompt
                  </h4>
                  <p className="rounded-lg bg-bg-primary p-3 text-xs text-text-secondary whitespace-pre-wrap">
                    {c.systemPrompt}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-medium text-text-muted uppercase">
                    User Prompt
                  </h4>
                  <p className="rounded-lg bg-bg-primary p-3 text-xs text-text-secondary whitespace-pre-wrap">
                    {c.userPrompt}
                  </p>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
