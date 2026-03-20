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
  dataQuality?: {
    hourlyRecords: number;
    dailySummaries: number;
    oldestDailyDate: string | null;
    newestDailyDate: string | null;
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
  cold_snap: '#22D3EE',
  wind_storm: '#FFFFFF',
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
  flood: 'text-accent-blue',
  heat_wave: 'text-accent-orange',
  cold_snap: 'text-severity-1',
  wind_storm: 'text-accent-green',
  thunderstorm: 'text-accent-yellow',
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
  return '#FFFFFF';
}

export function getConfidenceColor(c: number): string {
  if (c >= 0.8) return '#ef4444';
  if (c >= 0.6) return '#f97316';
  if (c >= 0.4) return '#eab308';
  return '#FFFFFF';
}

export function capitalizeField(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

// ── Shared components ──────────────────────────────────────────────

export function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-bg-secondary px-3 py-2 text-center">
      <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className={`font-[family-name:var(--font-mono)] text-sm font-bold ${accent ?? 'text-text-primary'}`}>{value}</p>
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
    <div className="glass-heavy rounded-lg border border-border bg-bg-card px-3 py-2 shadow-lg">
      {label !== undefined && (
        <p className="mb-1 text-[10px] text-text-muted">{label}</p>
      )}
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center font-[family-name:var(--font-mono)] text-xs" style={{ color: entry.color }}>
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
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

// ── Chart Annotation ──────────────────────────────────────────────

export function ChartAnnotation({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 border-l-2 border-text-muted/20 pl-3">
      <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-muted leading-relaxed">{children}</p>
    </div>
  );
}

// ── Semi-Circle Gauge ─────────────────────────────────────────────

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy - r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`;
}

export function SemiCircleGauge({ value, max = 100, size = 120, label }: { value: number; max?: number; size?: number; label?: string }) {
  const pct = Math.min(value / max, 1);
  const radius = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2 + 4;
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweepAngle = startAngle - (startAngle - endAngle) * pct;

  const bgArc = describeArc(cx, cy, radius, endAngle, startAngle);
  const fgArc = describeArc(cx, cy, radius, sweepAngle, startAngle);

  const color = value >= 70 ? '#ef4444' : value >= 50 ? '#f97316' : value >= 30 ? '#eab308' : '#22c55e';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <path d={bgArc} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} strokeLinecap="round" />
        <path d={fgArc} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const a = Math.PI - (tick / 100) * Math.PI;
          const x1 = cx + (radius + 2) * Math.cos(a);
          const y1 = cy - (radius + 2) * Math.sin(a);
          const x2 = cx + (radius - 4) * Math.cos(a);
          const y2 = cy - (radius - 4) * Math.sin(a);
          return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize={20} fontWeight="bold" fontFamily="var(--font-mono)">{value.toFixed(0)}</text>
        {label && <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--color-text-muted)" fontSize={9} fontFamily="var(--font-sans)">{label}</text>}
      </svg>
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
