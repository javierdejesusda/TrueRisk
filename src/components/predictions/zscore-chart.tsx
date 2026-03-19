'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ModelCard } from './model-card';
import { DarkTooltip, getZScoreColor, capitalizeField, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['zScore'];
}

export function ZScoreChart({ data }: Props) {
  const chartData = data.map((z) => ({
    name: capitalizeField(z.field),
    zScore: parseFloat(z.zScore.toFixed(2)),
    isAnomaly: z.isAnomaly,
  }));

  const hasAnomaly = data.some((z) => z.isAnomaly);

  return (
    <ModelCard
      title="Anomaly Detection"
      subtitle="Z-score deviation from historical baseline"
      methodology="Compares current weather values to historical averages using Z-scores. Values beyond ±2 standard deviations are flagged as anomalies, indicating unusual conditions."
      badge={hasAnomaly ? { label: 'Anomaly', variant: 'danger' } : undefined}
      index={4}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <Tooltip content={<DarkTooltip />} />
          <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine y={-2} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
          <Bar dataKey="zScore" name="Z-Score" radius={[4, 4, 0, 0]} animationDuration={800}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getZScoreColor(entry.zScore)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {data.map((z) => (
          <span key={z.field} className="inline-flex items-center gap-1 rounded-md bg-bg-secondary px-2 py-0.5 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getZScoreColor(z.zScore) }} />
            <span className="text-text-muted">{capitalizeField(z.field)}:</span>
            <span className="font-medium text-text-secondary">{z.zScore.toFixed(2)}</span>
          </span>
        ))}
      </div>
    </ModelCard>
  );
}
