'use client';

import { useMemo, memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ModelCard } from './model-card';
import { DarkTooltip, DISASTER_COLORS, DISASTER_LABELS, ChartAnnotation, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['bayesian'];
}

function BayesianChartInner({ data }: Props) {
  // Build grouped chart data with prior and posterior
  const chartData = useMemo(() => {
    return data.map((b) => ({
      name: DISASTER_LABELS[b.type] ?? b.type,
      type: b.type,
      prior: parseFloat((b.prior * 100).toFixed(1)),
      posterior: parseFloat((b.probability * 100).toFixed(1)),
    }));
  }, [data]);

  // Likelihood multipliers
  const multipliers = useMemo(() => {
    return data.map((b) => ({
      type: b.type,
      label: DISASTER_LABELS[b.type] ?? b.type,
      multiplier: b.prior > 0 ? (b.probability / b.prior).toFixed(1) : 'N/A',
    }));
  }, [data]);

  return (
    <ModelCard
      title="Bayesian Risk"
      subtitle="Prior vs posterior probability per disaster type"
      methodology="Combines prior knowledge about disaster frequencies with current weather conditions to update risk probabilities in real-time using Bayes' theorem."
      index={2}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }} barGap={2} barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="name" width={75} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <Tooltip content={<DarkTooltip />} />

          {/* Prior bars — semi-transparent */}
          <Bar dataKey="prior" name="Prior (%)" radius={[0, 4, 4, 0]} animationDuration={800} opacity={0.35}>
            {chartData.map((entry, i) => (
              <Cell key={`prior-${i}`} fill={DISASTER_COLORS[entry.type] ?? '#8b5cf6'} />
            ))}
          </Bar>

          {/* Posterior bars — full opacity */}
          <Bar dataKey="posterior" name="Posterior (%)" radius={[0, 4, 4, 0]} animationDuration={800}>
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
          <span className="text-text-muted">Highest risk:</span>
          <Badge
            variant={data[0]?.probability > 0.5 ? 'danger' : data[0]?.probability > 0.3 ? 'warning' : 'info'}
            size="sm"
          >
            {DISASTER_LABELS[data[0]?.type] ?? 'None'}{' '}
            ({(data[0]?.probability * 100).toFixed(1)}%)
          </Badge>
        </div>
      </div>

      <ChartAnnotation>
        Faded bars show prior beliefs; solid bars show updated posterior probabilities. The multiplier shows how much evidence shifted the estimate.
      </ChartAnnotation>
    </ModelCard>
  );
}

export const BayesianChart = memo(BayesianChartInner);
