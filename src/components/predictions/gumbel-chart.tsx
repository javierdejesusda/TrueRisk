'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ModelCard } from './model-card';
import { StatBox, DarkTooltip, GUMBEL_CONFIG, type GumbelTab, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['gumbel'];
}

export function GumbelChart({ data }: Props) {
  const [tab, setTab] = useState<GumbelTab>('precipitation');
  const gc = GUMBEL_CONFIG[tab];
  const gd = data[tab];

  return (
    <ModelCard
      title="Gumbel Extreme Value Distribution"
      subtitle="Probability density of extreme weather events"
      methodology="Fits extreme value distributions to historical weather data to estimate the probability of rare events. The curve shows how likely values of different magnitudes are."
      badge={{ label: 'EVD', variant: 'info' }}
      className="md:col-span-2 lg:col-span-2"
      index={0}
    >
      {/* Tab switcher */}
      <div className="mb-4 flex gap-1.5">
        {(Object.keys(GUMBEL_CONFIG) as GumbelTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              tab === t
                ? 'text-white'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary',
            ].join(' ')}
            style={tab === t ? { backgroundColor: GUMBEL_CONFIG[t].stroke + '30', color: GUMBEL_CONFIG[t].stroke } : undefined}
          >
            {GUMBEL_CONFIG[t].name}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={gd.pdfCurve} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gumbelPrecip" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gumbelTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gumbelWind" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" tickFormatter={(v: number) => v.toFixed(3)} />
          <Tooltip content={<DarkTooltip />} />
          <ReferenceLine x={gd.currentValue} stroke="#f97316" strokeDasharray="5 3" strokeWidth={2} label={{ value: 'Current', position: 'top', fill: '#f97316', fontSize: 10 }} />
          <Area type="monotone" dataKey="y" name="Density" stroke={gc.stroke} strokeWidth={2} fill={`url(#${gc.gradId})`} animationDuration={1200} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatBox label="Current" value={`${gd.currentValue} ${gc.unit}`} />
        <StatBox label="Exceedance" value={`${(gd.exceedanceProbability * 100).toFixed(1)}%`} />
        <StatBox label="Return Period" value={gd.returnPeriod >= 9999 ? '>9999 yr' : `~${gd.returnPeriod.toFixed(0)} yr`} />
      </div>

      <div className="mt-3">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Return Levels</p>
        <div className="flex flex-wrap gap-2">
          {gd.returnLevels.map((rl) => (
            <div key={rl.period} className="flex flex-col items-center rounded-lg bg-bg-secondary px-3 py-1.5">
              <span className="text-[10px] text-text-muted">{rl.period} yr</span>
              <span className="text-xs font-semibold" style={{ color: gc.stroke }}>{rl.value} {gc.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </ModelCard>
  );
}
