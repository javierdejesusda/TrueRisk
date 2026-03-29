'use client';

import { useState, useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { ModelCard } from './model-card';
import { StatBox, DarkTooltip, ChartAnnotation, GUMBEL_CONFIG, type GumbelTab, type PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['gumbel'];
}

function GumbelChartInner({ data }: Props) {
  const tStat = useTranslations('StatisticalModels');
  const [tab, setTab] = useState<GumbelTab>('precipitation');
  const gc = GUMBEL_CONFIG[tab];
  const gd = data[tab];

  // Calculate the 95th percentile x threshold for the danger zone
  const dangerZone = useMemo(() => {
    if (!gd.pdfCurve.length) return { x95: 0, xMax: 0 };
    const sorted = [...gd.pdfCurve].sort((a, b) => a.x - b.x);
    const idx95 = Math.floor(sorted.length * 0.95);
    return {
      x95: sorted[idx95]?.x ?? sorted[sorted.length - 1].x,
      xMax: sorted[sorted.length - 1].x,
    };
  }, [gd.pdfCurve]);

  // Find max return level for proportional mini-bars
  const maxReturnLevel = useMemo(() => {
    return Math.max(...gd.returnLevels.map((rl) => rl.value), 1);
  }, [gd.returnLevels]);

  return (
    <ModelCard
      title={tStat('gevTitle')}
      subtitle={tStat('gevSubtitle')}
      methodology={tStat('gevMethod')}
      badge={{ label: tStat('gevBadge'), variant: 'info' }}
      className="md:col-span-2 lg:col-span-2"
      index={0}
    >
      {/* Tab switcher */}
      <div className="mb-4 flex gap-1.5">
        {(Object.keys(GUMBEL_CONFIG) as GumbelTab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={[
              'cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              tab === tabKey
                ? 'text-white'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary',
            ].join(' ')}
            style={tab === tabKey ? { backgroundColor: GUMBEL_CONFIG[tabKey].stroke + '30', color: GUMBEL_CONFIG[tabKey].stroke } : undefined}
          >
            {tStat(GUMBEL_CONFIG[tabKey].nameKey)}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
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

          {/* Danger zone — 95th percentile shaded area */}
          <ReferenceArea
            x1={dangerZone.x95}
            x2={dangerZone.xMax}
            fill="rgba(239,68,68,0.08)"
            stroke="none"
          />

          {/* Current value animated reference line with label card */}
          <ReferenceLine
            x={gd.currentValue}
            stroke={gc.stroke}
            strokeDasharray="5 3"
            strokeWidth={2}
            label={{
              value: `${tStat('current')}: ${gd.currentValue} ${gc.unit}`,
              position: 'top',
              fill: gc.stroke,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
            }}
          />

          <Area type="monotone" dataKey="y" name="Density" stroke={gc.stroke} strokeWidth={2} fill={`url(#${gc.gradId})`} animationDuration={1200} />
        </AreaChart>
      </ResponsiveContainer>

      <div className={`mt-4 grid gap-3 ${gd.params.shape !== undefined ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <StatBox label={tStat('current')} value={`${gd.currentValue} ${gc.unit}`} />
        <StatBox label={tStat('exceedance')} value={`${(gd.exceedanceProbability * 100).toFixed(1)}%`} />
        <div>
          <StatBox label={tStat('returnPeriod')} value={gd.returnPeriod >= 9999 ? '>9999 yr' : `~${gd.returnPeriod.toFixed(0)} yr`} />
          {gd.returnPeriodCapped && (
            <p className="mt-1 text-center font-[family-name:var(--font-sans)] text-[9px] text-text-muted">
              {tStat('cappedAt', { value: gd.maxCredibleReturnPeriod?.toLocaleString() ?? '10,000' })}
            </p>
          )}
        </div>
        {gd.params.shape !== undefined && (
          <StatBox label={tStat('gevShape')} value={gd.params.shape.toFixed(3)} />
        )}
      </div>

      {/* Return Levels as horizontal mini-bars */}
      <div className="mt-3">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{tStat('returnLevels')}</p>
        <div className="space-y-1.5">
          {gd.returnLevels.map((rl) => {
            const pct = Math.max(4, (rl.value / maxReturnLevel) * 100);
            return (
              <div key={rl.period} className={`flex items-center gap-3 ${rl.lowConfidence ? 'opacity-40' : ''}`}>
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted w-12 text-right shrink-0">{rl.period} yr</span>
                <div className="flex-1 h-5 rounded bg-white/[0.03] overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: gc.stroke + '40',
                      borderRight: `2px solid ${gc.stroke}`,
                    }}
                  />
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[10px] font-semibold"
                    style={{ color: gc.stroke }}
                  >
                    {rl.value} {gc.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ChartAnnotation>
        {tStat('gumbelAnnotation')}
      </ChartAnnotation>
    </ModelCard>
  );
}

export const GumbelChart = memo(GumbelChartInner);
