'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import type { ScoreHistoryEntry } from '@/hooks/use-preparedness';

interface ScoreTrendProps {
  history: ScoreHistoryEntry[];
  label?: string;
}

export function ScoreTrend({ history, label }: ScoreTrendProps) {
  const data = history.map((entry) => ({
    date: new Date(entry.computed_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    score: Math.round(entry.total_score),
  }));

  if (data.length === 0) {
    return (
      <Card variant="glass" padding="md">
        <div className="flex flex-col items-center justify-center h-32 text-text-muted text-sm">
          {label && (
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
              {label}
            </h3>
          )}
          <p>Score history will appear here as you complete items</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="md">
      {label && (
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          {label}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'white',
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#scoreFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
