'use client';

import { useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ModelCard } from './model-card';
import { DarkTooltip, DISASTER_COLORS, DISASTER_LABEL_KEYS, ChartAnnotation, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['bayesian'];
}

function BayesianChartInner({ data }: Props) {
  const t = useTranslations('StatisticalModels');
  const tHaz = useTranslations('HazardModels');

  // Build grouped chart data with prior and posterior
  const chartData = useMemo(() => {
    return data.map((b) => ({
      name: tHaz(DISASTER_LABEL_KEYS[b.type] ?? 'disasterGeneral'),
      type: b.type,
      prior: parseFloat((b.prior * 100).toFixed(1)),
      posterior: parseFloat((b.probability * 100).toFixed(1)),
    }));
  }, [data, tHaz]);

  // Likelihood multipliers
  const multipliers = useMemo(() => {
    return data.map((b) => ({
      type: b.type,
      label: tHaz(DISASTER_LABEL_KEYS[b.type] ?? 'disasterGeneral'),
      multiplier: b.prior > 0 ? (b.probability / b.prior).toFixed(1) : 'N/A',
    }));
  }, [data, tHaz]);

  return (
    <ModelCard
      title={t('bayesian')}
      subtitle={t('bayesianSubtitleAlt')}
      methodology={t('bayesianMethod')}
      index={2}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }} barGap={2} barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="name" width={75} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <Tooltip content={<DarkTooltip />} />

          {/* Prior bars — semi-transparent */}
          <Bar dataKey="prior" name={t('priorPct')} radius={[0, 4, 4, 0]} animationDuration={800} opacity={0.35}>
            {chartData.map((entry, i) => (
              <Cell key={`prior-${i}`} fill={DISASTER_COLORS[entry.type] ?? '#8b5cf6'} />
            ))}
          </Bar>

          {/* Posterior bars — full opacity */}
          <Bar dataKey="posterior" name={t('posteriorPct')} radius={[0, 4, 4, 0]} animationDuration={800}>
            {chartData.map((entry, i) => (
              <Cell key={`post-${i}`} fill={DISASTER_COLORS[entry.type] ?? '#8b5cf6'} />
            ))}
            <LabelList
              dataKey="posterior"
              position="right"
              fill="var(--color-text-muted)"
              fontSize={9}
              fontFamily="var(--font-mono)"
              formatter={(v) => `${v}%`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Likelihood multipliers */}
      <div className="mt-3 flex flex-wrap gap-2">
        {multipliers.map((m) => (
          <div key={m.type} className="flex items-center gap-1.5 rounded-md bg-white/[0.03] px-2 py-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DISASTER_COLORS[m.type] ?? '#8b5cf6' }} />
            <span className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted">{m.label}</span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] font-semibold text-text-secondary">{m.multiplier}x</span>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">{t('highestRisk')}:</span>
          <Badge
            variant={data[0]?.probability > 0.5 ? 'danger' : data[0]?.probability > 0.3 ? 'warning' : 'info'}
            size="sm"
          >
            {data[0]?.type ? tHaz(DISASTER_LABEL_KEYS[data[0]?.type] ?? 'disasterGeneral') : tHaz('none')}{' '}
            ({(data[0]?.probability * 100).toFixed(1)}%)
          </Badge>
        </div>
      </div>

      <ChartAnnotation>
        {t('bayesianAnnotation')}
      </ChartAnnotation>
    </ModelCard>
  );
}

export const BayesianChart = memo(BayesianChartInner);
