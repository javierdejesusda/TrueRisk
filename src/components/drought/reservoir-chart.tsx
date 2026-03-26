'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ReservoirData } from '@/hooks/use-reservoirs';

function fillColor(pct: number): string {
  if (pct >= 70) return '#22c55e';
  if (pct >= 40) return '#fbbf24';
  if (pct >= 20) return '#f97316';
  return '#ef4444';
}

interface ReservoirChartProps {
  reservoirs: ReservoirData[];
}

export function ReservoirChart({ reservoirs }: ReservoirChartProps) {
  const t = useTranslations('Drought');
  const isStale = reservoirs?.some((r: any) => r.stale);

  if (!reservoirs || reservoirs.length === 0) {
    return (
      <Card variant="glass" padding="md">
        <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-4">
          {t('reservoirs')}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-muted">
          {t('noReservoirData')}
        </p>
      </Card>
    );
  }

  const chartData = reservoirs
    .filter((r) => r.capacity_hm3 > 0)
    .map((r) => ({
      name: r.name.length > 18 ? r.name.slice(0, 16) + '...' : r.name,
      fullName: r.name,
      fill_pct: Math.round((r.volume_hm3 / r.capacity_hm3) * 100),
      volume: r.volume_hm3,
      capacity: r.capacity_hm3,
    }))
    .sort((a, b) => a.fill_pct - b.fill_pct)
    .slice(0, 12);

  return (
    <Card variant="glass" padding="md">
      <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-4">
        {t('reservoirs')}
      </h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#7A7A90', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: '#A0A0B0', fontSize: 10, fontFamily: 'var(--font-sans)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 30, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                color: '#e0e0e0',
              }}
              formatter={(value, _name, props) => {
                const p = props.payload as { volume: number; capacity: number; fullName: string };
                return [
                  `${value}% (${p.volume.toFixed(0)} / ${p.capacity.toFixed(0)} hm3)`,
                  p.fullName,
                ];
              }}
            />
            <Bar dataKey="fill_pct" radius={[0, 4, 4, 0]} barSize={14}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={fillColor(entry.fill_pct)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {isStale && (
        <p className="text-xs text-amber-400 mt-2">{t('dataOutdated')}</p>
      )}
    </Card>
  );
}
