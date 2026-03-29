'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ModelCard } from './model-card';
import { DarkTooltip } from './shared';
import type { ForecastResponse } from './shared';

interface Props {
  data: ForecastResponse | null;
}

export function AttentionWeightsChart({ data }: Props) {
  const t = useTranslations('Predictions');

  const chartData = useMemo(() => {
    if (!data || data.hazards.length === 0) return [];
    // Aggregate attention weights across all hazards
    const totals: Record<string, number> = {};
    let count = 0;
    for (const hf of data.hazards) {
      if (hf.attention_weights && Object.keys(hf.attention_weights).length > 0) {
        count++;
        for (const [key, val] of Object.entries(hf.attention_weights)) {
          totals[key] = (totals[key] ?? 0) + val;
        }
      }
    }
    if (count === 0) return [];
    // Average and take top 10
    return Object.entries(totals)
      .map(([feature, total]) => ({ feature, weight: total / count }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);
  }, [data]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <ModelCard
      title={t('tftAttention')}
      subtitle={t('tftAttentionSubtitle')}
      methodology={t('tftAttentionMethod')}
      badge={{ label: t('attention'), variant: 'info' }}
      index={1}
    >
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="feature"
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="weight" fill="#22c55e" radius={[0, 4, 4, 0]} name={t('weight')} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ModelCard>
  );
}
