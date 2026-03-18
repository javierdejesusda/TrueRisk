'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ModelCard } from './model-card';
import { DarkTooltip, DISASTER_COLORS, DISASTER_LABELS, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['bayesian'];
}

export function BayesianChart({ data }: Props) {
  const chartData = data.map((b) => ({
    name: DISASTER_LABELS[b.type] ?? b.type,
    type: b.type,
    probability: parseFloat((b.probability * 100).toFixed(1)),
  }));

  return (
    <ModelCard
      title="Bayesian Risk"
      subtitle="Posterior probability per disaster type"
      methodology="Combines prior knowledge about disaster frequencies with current weather conditions to update risk probabilities in real-time using Bayes' theorem."
      index={2}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="name" width={75} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <Tooltip content={<DarkTooltip />} />
          <Bar dataKey="probability" name="Probability (%)" radius={[0, 4, 4, 0]} animationDuration={800}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={DISASTER_COLORS[entry.type] ?? '#8b5cf6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

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
    </ModelCard>
  );
}
