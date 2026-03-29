'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTranslations } from 'next-intl';
import type { FeatureContribution } from '@/hooks/use-risk-explain';

const HAZARD_COLORS: Record<string, string> = {
  flood: '#3b82f6',
  wildfire: '#f97316',
  drought: '#FBBF24',
  heatwave: '#ef4444',
  seismic: '#a855f7',
  coldwave: '#22D3EE',
  windstorm: '#94a3b8',
};

function formatFeatureName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/(\d+)([A-Za-z])/g, '$1 $2');
}

interface Props {
  hazard: string;
  contributions: FeatureContribution[];
  maxItems?: number;
}

export function FeatureImportanceChart({ hazard, contributions, maxItems = 5 }: Props) {
  const t = useTranslations('HazardModels');
  const color = HAZARD_COLORS[hazard] ?? '#22c55e';
  const top = contributions
    .filter((c) => c.contribution > 0)
    .slice(0, maxItems);

  if (top.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-text-muted text-xs">
        {t('noSignificantFeatures')}
      </div>
    );
  }

  const chartData = top.map((c) => ({
    name: formatFeatureName(c.feature),
    contribution: c.contribution,
    value: c.value,
    description: c.description,
  }));

  return (
    <div className="mt-3">
      <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider mb-2">
        {t('featureImportance')}
      </p>
      <ResponsiveContainer width="100%" height={top.length * 32 + 16}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
            stroke="rgba(255,255,255,0.1)"
            domain={[0, 'auto']}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
            stroke="rgba(255,255,255,0.1)"
            width={90}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="glass-heavy rounded-lg border border-border bg-bg-card px-3 py-2 shadow-lg">
                  <p className="font-[family-name:var(--font-mono)] text-xs font-bold" style={{ color }}>
                    +{d.contribution} pts
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">Value: {d.value}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">{d.description}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="contribution" radius={[0, 4, 4, 0]} animationDuration={600}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={1 - i * 0.12} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
