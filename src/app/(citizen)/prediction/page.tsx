'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────

interface GumbelData {
  params: { mu: number; beta: number };
  currentValue: number;
  exceedanceProbability: number;
  returnPeriod: number;
  pdfCurve: Array<{ x: number; y: number }>;
  returnLevels: Array<{ period: number; value: number }>;
}

interface PredictionResponse {
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

type GumbelTab = 'precipitation' | 'temperature' | 'windSpeed';

// ── Constants ──────────────────────────────────────────────────────

const GUMBEL_CONFIG: Record<GumbelTab, { name: string; unit: string; stroke: string; gradId: string }> = {
  precipitation: { name: 'Precipitation', unit: 'mm', stroke: '#8b5cf6', gradId: 'gumbelPrecip' },
  temperature: { name: 'Temperature', unit: '\u00B0C', stroke: '#f97316', gradId: 'gumbelTemp' },
  windSpeed: { name: 'Wind Speed', unit: 'km/h', stroke: '#06b6d4', gradId: 'gumbelWind' },
};

const DISASTER_COLORS: Record<string, string> = {
  flood: '#3b82f6',
  heat_wave: '#f97316',
  cold_snap: '#06b6d4',
  wind_storm: '#22c55e',
};

const DISASTER_LABELS: Record<string, string> = {
  flood: 'Flood',
  heat_wave: 'Heat Wave',
  cold_snap: 'Cold Snap',
  wind_storm: 'Wind Storm',
};

const EMERGENCY_LABELS: Record<string, string> = {
  flood: 'Flood',
  heat_wave: 'Heat Wave',
  cold_snap: 'Cold Snap',
  wind_storm: 'Wind Storm',
  thunderstorm: 'Thunderstorm',
  general: 'General',
};

const EMERGENCY_COLORS: Record<string, string> = {
  flood: 'text-blue-400',
  heat_wave: 'text-orange-400',
  cold_snap: 'text-cyan-400',
  wind_storm: 'text-green-400',
  thunderstorm: 'text-yellow-400',
  general: 'text-text-secondary',
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

// ── Helpers ────────────────────────────────────────────────────────

function getZScoreColor(z: number): string {
  const abs = Math.abs(z);
  if (abs >= 2) return '#ef4444';
  if (abs >= 1) return '#eab308';
  return '#22c55e';
}

function getConfidenceColor(c: number): string {
  if (c >= 0.8) return '#ef4444';
  if (c >= 0.6) return '#f97316';
  if (c >= 0.4) return '#eab308';
  return '#22c55e';
}

function capitalizeField(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

// ── Shared components ──────────────────────────────────────────────

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-bg-secondary px-3 py-2 text-center">
      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold ${accent ?? 'text-text-primary'}`}>{value}</p>
    </div>
  );
}

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

function DarkTooltip({
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

function LoadingSkeleton() {
  return (
    <motion.div
      className="flex flex-col gap-6 px-4 py-8 sm:px-8"
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

// ── Main page ──────────────────────────────────────────────────────

export default function PredictionPage() {
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gumbelTab, setGumbelTab] = useState<GumbelTab>('precipitation');

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const res = await fetch('/api/analysis/predictions');
        const json = await res.json();
        if (res.ok) {
          setData(json);
        } else {
          setError(json.detail ?? 'Failed to load predictions');
        }
      } catch {
        setError('Failed to load predictions');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPredictions();
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-sm text-text-muted">{error ?? 'No prediction data available'}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const gc = GUMBEL_CONFIG[gumbelTab];
  const gd = data.gumbel[gumbelTab];

  const bayesianChartData = data.bayesian.map((b) => ({
    name: DISASTER_LABELS[b.type] ?? b.type,
    type: b.type,
    probability: parseFloat((b.probability * 100).toFixed(1)),
  }));

  const zScoreChartData = data.zScore.map((z) => ({
    name: capitalizeField(z.field),
    zScore: parseFloat(z.zScore.toFixed(2)),
    isAnomaly: z.isAnomaly,
  }));

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Predictions</h1>
        <p className="mt-1 text-sm text-text-muted">
          ML model forecasts and extreme value analysis
        </p>
      </div>

      {/* Chart grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* ── Gumbel Extreme Value (2 cols) ─────────────────────── */}
        <motion.div
          className="md:col-span-2 lg:col-span-2"
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-text-secondary">
                Gumbel Extreme Value Distribution
              </h3>
              <Badge variant="info" size="sm">EVD</Badge>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Probability density of extreme weather events
            </p>

            {/* Tab switcher */}
            <div className="mb-4 flex gap-1.5">
              {(Object.keys(GUMBEL_CONFIG) as GumbelTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGumbelTab(tab)}
                  className={[
                    'cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    gumbelTab === tab
                      ? 'text-white'
                      : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary',
                  ].join(' ')}
                  style={gumbelTab === tab ? { backgroundColor: GUMBEL_CONFIG[tab].stroke + '30', color: GUMBEL_CONFIG[tab].stroke } : undefined}
                >
                  {GUMBEL_CONFIG[tab].name}
                </button>
              ))}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={gd.pdfCurve} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gumbelPrecip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gumbelTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gumbelWind" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.1)"
                  tickFormatter={(v: number) => v.toFixed(3)}
                />
                <Tooltip content={<DarkTooltip />} />
                <ReferenceLine
                  x={gd.currentValue}
                  stroke="#f97316"
                  strokeDasharray="5 3"
                  strokeWidth={2}
                  label={{ value: 'Current', position: 'top', fill: '#f97316', fontSize: 10 }}
                />
                <Area
                  type="monotone"
                  dataKey="y"
                  name="Density"
                  stroke={gc.stroke}
                  strokeWidth={2}
                  fill={`url(#${gc.gradId})`}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatBox
                label="Current"
                value={`${gd.currentValue} ${gc.unit}`}
                accent={`text-[${gc.stroke}]`}
              />
              <StatBox
                label="Exceedance"
                value={`${(gd.exceedanceProbability * 100).toFixed(1)}%`}
              />
              <StatBox
                label="Return Period"
                value={gd.returnPeriod >= 9999 ? '>9999 yr' : `~${gd.returnPeriod.toFixed(0)} yr`}
              />
            </div>

            {/* Return levels */}
            <div className="mt-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
                Return Levels
              </p>
              <div className="flex flex-wrap gap-2">
                {gd.returnLevels.map((rl) => (
                  <div
                    key={rl.period}
                    className="flex flex-col items-center rounded-lg bg-bg-secondary px-3 py-1.5"
                  >
                    <span className="text-[10px] text-text-muted">{rl.period} yr</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: gc.stroke }}
                    >
                      {rl.value} {gc.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Regression Forecast ───────────────────────────────── */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={1}>
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-1">
              Trend Forecast
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Linear regression with 6h &amp; 12h projection
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.regression.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="step"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <Tooltip content={<DarkTooltip />} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual (mm)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 1.5, fill: '#3b82f6' }}
                  connectNulls={false}
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="fitted"
                  name="Predicted (mm)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  connectNulls
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatBox label="R\u00B2" value={data.regression.rSquared.toFixed(3)} />
              <StatBox label="Slope" value={`${data.regression.slope >= 0 ? '+' : ''}${data.regression.slope.toFixed(3)}`} />
              <StatBox label="6h Forecast" value={`${data.regression.projected6h} mm`} accent="text-cyan-400" />
              <StatBox label="12h Forecast" value={`${data.regression.projected12h} mm`} accent="text-cyan-400" />
            </div>
          </Card>
        </motion.div>

        {/* ── Bayesian Risk Probabilities ───────────────────────── */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={2}>
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-1">
              Bayesian Risk
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Posterior probability per disaster type
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                layout="vertical"
                data={bayesianChartData}
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.1)"
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={75}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="probability" name="Probability (%)" radius={[0, 4, 4, 0]} animationDuration={800}>
                  {bayesianChartData.map((entry, i) => (
                    <Cell key={i} fill={DISASTER_COLORS[entry.type] ?? '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">Highest risk:</span>
                <Badge
                  variant={data.bayesian[0]?.probability > 0.5 ? 'danger' : data.bayesian[0]?.probability > 0.3 ? 'warning' : 'info'}
                  size="sm"
                >
                  {DISASTER_LABELS[data.bayesian[0]?.type] ?? 'None'}{' '}
                  ({(data.bayesian[0]?.probability * 100).toFixed(1)}%)
                </Badge>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── EMA Trend Detection ──────────────────────────────── */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={3}>
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-text-secondary">
                EMA Trend
              </h3>
              <Badge
                variant={data.ema.trend === 'rising' ? 'danger' : data.ema.trend === 'falling' ? 'success' : 'neutral'}
                size="sm"
              >
                {data.ema.trend === 'rising' ? '\u2191 Rising' : data.ema.trend === 'falling' ? '\u2193 Falling' : '\u2192 Stable'}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Exponential moving average on precipitation
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.ema.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="step"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <Tooltip content={<DarkTooltip />} />
                <Line
                  type="monotone"
                  dataKey="raw"
                  name="Raw (mm)"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  opacity={0.5}
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="smoothed"
                  name="EMA (mm)"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={false}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatBox label="Trend" value={data.ema.trend} accent={data.ema.trend === 'rising' ? 'text-red-400' : data.ema.trend === 'falling' ? 'text-green-400' : 'text-text-secondary'} />
              <StatBox label="Rate" value={`${data.ema.rateOfChange >= 0 ? '+' : ''}${data.ema.rateOfChange.toFixed(3)}/step`} />
            </div>
          </Card>
        </motion.div>

        {/* ── Z-Score Anomaly Detection ─────────────────────────── */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={4}>
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-text-secondary">
                Anomaly Detection
              </h3>
              {data.zScore.some((z) => z.isAnomaly) && (
                <Badge variant="danger" size="sm" pulse>
                  Anomaly
                </Badge>
              )}
            </div>
            <p className="text-xs text-text-muted mb-4">
              Z-score deviation from historical baseline
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={zScoreChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <Tooltip content={<DarkTooltip />} />
                <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={-2} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="zScore" name="Z-Score" radius={[4, 4, 0, 0]} animationDuration={800}>
                  {zScoreChartData.map((entry, i) => (
                    <Cell key={i} fill={getZScoreColor(entry.zScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.zScore.map((z) => (
                <span
                  key={z.field}
                  className="inline-flex items-center gap-1 rounded-md bg-bg-secondary px-2 py-0.5 text-[10px]"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: getZScoreColor(z.zScore) }}
                  />
                  <span className="text-text-muted">{capitalizeField(z.field)}:</span>
                  <span className="font-medium text-text-secondary">{z.zScore.toFixed(2)}</span>
                </span>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ── Decision Tree Classification ──────────────────────── */}
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={5}>
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-1">
              Emergency Classification
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Rules-based decision tree
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className={`text-2xl font-bold ${EMERGENCY_COLORS[data.decisionTree.type] ?? 'text-text-primary'}`}>
                {EMERGENCY_LABELS[data.decisionTree.type] ?? data.decisionTree.type}
              </div>

              {/* Confidence bar */}
              <div className="w-full">
                <div className="flex justify-between text-xs text-text-muted mb-1.5">
                  <span>Confidence</span>
                  <span className="font-medium text-text-secondary">
                    {(data.decisionTree.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.decisionTree.confidence * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ backgroundColor: getConfidenceColor(data.decisionTree.confidence) }}
                  />
                </div>
              </div>

              {/* Matched rules */}
              <div className="w-full space-y-1.5">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">
                  Matched Rules
                </p>
                {data.decisionTree.matchedRules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-text-muted">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green/50" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── KNN Historical Pattern Matching (2 cols) ──────────── */}
        <motion.div
          className="md:col-span-2 lg:col-span-2"
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={6}
        >
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-1">
              Historical Pattern Matching (KNN)
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Nearest historical weather events by Euclidean distance
            </p>

            <div className="space-y-2.5">
              {data.knn.map((event, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-bg-secondary p-3 transition-colors hover:bg-bg-secondary/80"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-primary">
                        {event.event}
                      </span>
                      <Badge variant="neutral" size="sm">{event.year}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted line-clamp-1">
                      {event.outcome}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-text-muted">Distance</span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-bg-primary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-700"
                          style={{ width: `${Math.max(5, (1 - event.distance) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium tabular-nums text-amber-400">
                        {event.distance.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
