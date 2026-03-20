'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Cell } from 'recharts';
import { ModelCard } from './model-card';
import { DarkTooltip, getZScoreColor, capitalizeField, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['zScore'];
}

export function ZScoreChart({ data }: Props) {
  const chartData = useMemo(() => {
    return data.map((z) => ({
      name: capitalizeField(z.field),
      zScore: parseFloat(z.zScore.toFixed(2)),
      isAnomaly: z.isAnomaly,
    }));
  }, [data]);

  const anomalyCount = useMemo(() => data.filter((z) => z.isAnomaly).length, [data]);
  const hasAnomaly = anomalyCount > 0;

  return (
    <ModelCard
      title="Anomaly Detection"
      subtitle="Z-score deviation from historical baseline"
      methodology="Compares current weather values to historical averages using Z-scores. Values beyond \u00B12 standard deviations are flagged as anomalies, indicating unusual conditions."
      badge={hasAnomaly ? { label: 'Anomaly', variant: 'danger' } : undefined}
      index={4}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" domain={[-5, 5]} />
          <Tooltip content={<DarkTooltip />} />

          {/* Background zone bands */}
          {/* Green — normal zone */}
          <ReferenceArea y1={-1} y2={1} fill="rgba(34,197,94,0.06)" stroke="none" />
          {/* Yellow — warning zones */}
          <ReferenceArea y1={1} y2={2} fill="rgba(234,179,8,0.06)" stroke="none" />
          <ReferenceArea y1={-2} y2={-1} fill="rgba(234,179,8,0.06)" stroke="none" />
          {/* Red — anomaly zones */}
          <ReferenceArea y1={2} y2={5} fill="rgba(239,68,68,0.06)" stroke="none" />
          <ReferenceArea y1={-5} y2={-2} fill="rgba(239,68,68,0.06)" stroke="none" />

          {/* Reference lines with labels */}
          <ReferenceLine
            y={2}
            stroke="#ef4444"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{ value: 'Anomaly', position: 'right', fill: '#ef4444', fontSize: 9, fontFamily: 'var(--font-mono)' }}
          />
          <ReferenceLine
            y={-2}
            stroke="#ef4444"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{ value: 'Anomaly', position: 'right', fill: '#ef4444', fontSize: 9, fontFamily: 'var(--font-mono)' }}
          />
          <ReferenceLine
            y={0}
            stroke="rgba(255,255,255,0.2)"
            label={{ value: 'Baseline', position: 'right', fill: 'var(--color-text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
          />

          <Bar dataKey="zScore" name="Z-Score" radius={[4, 4, 0, 0]} animationDuration={800}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getZScoreColor(entry.zScore)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Anomaly count badge */}
      <div className="mt-3 flex items-center gap-2">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${hasAnomaly ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
          <span className={`h-2 w-2 rounded-full ${hasAnomaly ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
          {hasAnomaly
            ? `${anomalyCount} anomal${anomalyCount === 1 ? 'y' : 'ies'} detected`
            : 'No anomalies'
          }
        </div>
      </div>
    </ModelCard>
  );
}
