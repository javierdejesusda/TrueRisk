'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, ComposedChart,
} from 'recharts';
import { ModelCard } from './model-card';
import { DarkTooltip, StatBox } from './shared';
import type { ForecastResponse } from './shared';
import { Skeleton } from '@/components/ui/skeleton';

const HAZARD_COLORS: Record<string, string> = {
  flood: '#3b82f6',
  wildfire: '#f97316',
  heatwave: '#ef4444',
  drought: '#eab308',
};

const HORIZON_LABELS: Record<number, string> = {
  6: '+6h',
  12: '+12h',
  24: '+24h',
  48: '+48h',
  72: '+72h',
  168: '+7d',
};

interface Props {
  data: ForecastResponse | null;
  isLoading: boolean;
}

function HazardForecastMini({ hazard, horizons, color }: {
  hazard: string;
  horizons: Array<{ horizon_hours: number; q10: number; q50: number; q90: number }>;
  color: string;
}) {
  const tHaz = useTranslations('HazardModels');
  const hazardLabel: Record<string, string> = {
    flood: tHaz('disasterFlood'),
    wildfire: tHaz('wildfire'),
    heatwave: tHaz('heatwave'),
    drought: tHaz('drought'),
  };

  const chartData = useMemo(() => {
    return horizons.map((h) => ({
      label: HORIZON_LABELS[h.horizon_hours] ?? `+${h.horizon_hours}h`,
      q10: h.q10,
      q50: h.q50,
      q90: h.q90,
    }));
  }, [horizons]);

  const currentQ50 = horizons[0]?.q50 ?? 0;
  const maxQ90 = Math.max(...horizons.map((h) => h.q90), 0);

  return (
    <div className="rounded-lg bg-bg-secondary/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-[family-name:var(--font-display)] text-xs font-bold text-text-secondary">
            {hazardLabel[hazard] ?? hazard}
          </span>
        </div>
        <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted">
          {currentQ50.toFixed(1)}
        </span>
      </div>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, Math.max(maxQ90 * 1.1, 10)]}
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<DarkTooltip />} />
            <defs>
              <linearGradient id={`band-${hazard}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="q90"
              stroke="none"
              fill={`url(#band-${hazard})`}
              name="q90"
            />
            <Area
              type="monotone"
              dataKey="q10"
              stroke="none"
              fill="var(--color-bg-primary)"
              name="q10"
            />
            <Line
              type="monotone"
              dataKey="q50"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              name="q50"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ForecastChart({ data, isLoading }: Props) {
  const t = useTranslations('Predictions');

  if (isLoading) {
    return (
      <ModelCard
        title={t('forecastTitle')}
        subtitle={t('forecastSubtitle')}
        methodology={t('forecastMethod')}
        badge={{ label: t('tftGnn'), variant: 'info' }}
        className="lg:col-span-3 md:col-span-2"
        index={0}
      >
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="180px" />
          ))}
        </div>
      </ModelCard>
    );
  }

  if (!data || data.hazards.length === 0) {
    return (
      <ModelCard
        title={t('forecastTitle')}
        subtitle={t('forecastSubtitle')}
        methodology={t('forecastMethod')}
        badge={{ label: t('tftGnn'), variant: 'neutral' }}
        className="lg:col-span-3 md:col-span-2"
        index={0}
      >
        <div className="flex items-center justify-center h-[200px]">
          <p className="font-[family-name:var(--font-sans)] text-sm text-text-muted">
            {t('noForecastData')}
          </p>
        </div>
      </ModelCard>
    );
  }

  return (
    <ModelCard
      title={t('forecastTitle')}
      subtitle={t('forecastSubtitle')}
      methodology={t('forecastMethodFull')}
      badge={{ label: t('tftGnn'), variant: 'info' }}
      className="lg:col-span-3 md:col-span-2"
      index={0}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.hazards.map((hf) => (
          <HazardForecastMini
            key={hf.hazard}
            hazard={hf.hazard}
            horizons={hf.horizons}
            color={HAZARD_COLORS[hf.hazard] ?? '#8b5cf6'}
          />
        ))}
      </div>
      {data.computed_at && (
        <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px] text-text-muted text-right">
          {t('computed')}: {new Date(data.computed_at).toLocaleString()}
        </p>
      )}
    </ModelCard>
  );
}
