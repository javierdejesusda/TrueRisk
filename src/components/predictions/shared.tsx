'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────

export interface GumbelData {
  params: { mu: number; beta: number };
  currentValue: number;
  exceedanceProbability: number;
  returnPeriod: number;
  pdfCurve: Array<{ x: number; y: number }>;
  returnLevels: Array<{ period: number; value: number }>;
}

export interface PredictionResponse {
  gumbel: {
    precipitation: GumbelData;
    temperature: GumbelData;
    windSpeed: GumbelData;
  };
  regression: {
    slope: number;
    intercept: number;
    rSquared: number;
    projected6h: number;
    projected12h: number;
    data: Array<{ step: number; actual: number | null; fitted: number }>;
  };
  bayesian: Array<{ type: string; probability: number; prior: number; likelihood: number }>;
  ema: {
    data: Array<{ step: number; raw: number; smoothed: number }>;
    trend: string;
    rateOfChange: number;
  };
  zScore: Array<{
    field: string;
    value: number;
    mean: number;
    stdDev: number;
    zScore: number;
    isAnomaly: boolean;
  }>;
  decisionTree: {
    type: string;
    confidence: number;
    matchedRules: string[];
  };
  knn: Array<{ event: string; distance: number; outcome: string; year: number }>;
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    pressure: number;
  };
}

export type GumbelTab = 'precipitation' | 'temperature' | 'windSpeed';

// ── Constants ──────────────────────────────────────────────────────

export const GUMBEL_CONFIG: Record<GumbelTab, { name: string; unit: string; stroke: string; gradId: string }> = {
  precipitation: { name: 'Precipitation', unit: 'mm', stroke: '#8b5cf6', gradId: 'gumbelPrecip' },
  temperature: { name: 'Temperature', unit: '\u00B0C', stroke: '#f97316', gradId: 'gumbelTemp' },
  windSpeed: { name: 'Wind Speed', unit: 'km/h', stroke: '#06b6d4', gradId: 'gumbelWind' },
};

export const DISASTER_COLORS: Record<string, string> = {
  flood: '#3b82f6',
  heat_wave: '#f97316',
  cold_snap: '#06b6d4',
  wind_storm: '#22c55e',
};

export const DISASTER_LABELS: Record<string, string> = {
  flood: 'Flood',
  heat_wave: 'Heat Wave',
  cold_snap: 'Cold Snap',
  wind_storm: 'Wind Storm',
};

export const EMERGENCY_LABELS: Record<string, string> = {
  flood: 'Flood',
  heat_wave: 'Heat Wave',
  cold_snap: 'Cold Snap',
  wind_storm: 'Wind Storm',
  thunderstorm: 'Thunderstorm',
  general: 'General',
};

export const EMERGENCY_COLORS: Record<string, string> = {
  flood: 'text-blue-400',
  heat_wave: 'text-orange-400',
  cold_snap: 'text-cyan-400',
  wind_storm: 'text-green-400',
  thunderstorm: 'text-yellow-400',
  general: 'text-text-secondary',
};

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

// ── Helpers ────────────────────────────────────────────────────────

export function getZScoreColor(z: number): string {
  const abs = Math.abs(z);
  if (abs >= 2) return '#ef4444';
  if (abs >= 1) return '#eab308';
  return '#22c55e';
}

export function getConfidenceColor(c: number): string {
  if (c >= 0.8) return '#ef4444';
  if (c >= 0.6) return '#f97316';
  if (c >= 0.4) return '#eab308';
  return '#22c55e';
}

export function capitalizeField(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

// ── Shared components ──────────────────────────────────────────────

export function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-bg-secondary px-3 py-2 text-center">
      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold ${accent ?? 'text-text-primary'}`}>{value}</p>
    </div>
  );
}

export interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

export function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-bg-card px-3 py-2 shadow-lg">
      {label !== undefined && (
        <p className="mb-1 text-[10px] text-text-muted">{label}</p>
      )}
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}:{' '}
          {typeof entry.value === 'number'
            ? Math.abs(entry.value) < 0.01 && entry.value !== 0
              ? entry.value.toExponential(2)
              : entry.value.toFixed(2)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────

export function LoadingSkeleton() {
  return (
    <motion.div
      className="flex flex-col gap-6 pt-20 px-6 lg:px-12 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div>
        <Skeleton width="180px" height="28px" className="mb-2" />
        <Skeleton width="300px" height="14px" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card
            key={i}
            className={i === 0 ? 'lg:col-span-2' : i === 6 ? 'lg:col-span-2' : ''}
          >
            <Skeleton width="50%" height="16px" className="mb-3" />
            <Skeleton width="100%" height={i === 0 ? '240px' : '200px'} />
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
