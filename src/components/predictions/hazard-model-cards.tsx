'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { ModelCard } from './model-card';
import { DarkTooltip, StatBox, SemiCircleGauge } from './shared';
import { FeatureImportanceChart } from './feature-importance-chart';
import type { HazardExplanation } from '@/hooks/use-risk-explain';

interface HazardScore {
  flood_score: number;
  wildfire_score: number;
  drought_score: number;
  heatwave_score: number;
  seismic_score: number;
  coldwave_score: number;
  windstorm_score: number;
  composite_score: number;
  dominant_hazard: string;
  severity: string;
}

interface Props {
  riskData: HazardScore | null;
  explanations?: HazardExplanation[];
}

function scoreBadge(score: number, t?: (key: string) => string): { label: string; variant: 'danger' | 'warning' | 'info' | 'success' } {
  if (score >= 70) return { label: t ? t('highRisk') : 'High Risk', variant: 'danger' };
  if (score >= 50) return { label: t ? t('moderateRisk') : 'Moderate Risk', variant: 'warning' };
  if (score >= 30) return { label: t ? t('lowRisk') : 'Low Risk', variant: 'info' };
  return { label: t ? t('minimal') : 'Minimal', variant: 'success' };
}

function getExplanation(explanations: HazardExplanation[] | undefined, hazard: string): HazardExplanation | undefined {
  return explanations?.find((e) => e.hazard === hazard);
}

function FeatureBar({ name, value, color }: { name: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted w-24 shrink-0 truncate">{name}</span>
      <div className="flex-1 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function HazardCardContent({ score, hazard, explanation, statBoxes, fallbackFeatures }: {
  score: number;
  hazard: string;
  explanation?: HazardExplanation;
  statBoxes: { label: string; value: string }[];
  fallbackFeatures: { name: string; value: number; color: string }[];
}) {
  const t = useTranslations('HazardModels');
  const hasExplain = explanation && explanation.contributions.length > 0;

  return (
    <>
      <SemiCircleGauge value={score} label={t('riskScore')} />
      <div className="grid grid-cols-3 gap-2 mt-3">
        {statBoxes.map((box) => (
          <StatBox key={box.label} label={box.label} value={box.value} />
        ))}
      </div>
      {hasExplain ? (
        <FeatureImportanceChart hazard={hazard} contributions={explanation.contributions} maxItems={5} />
      ) : (
        <div className="mt-3 space-y-1.5">
          <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider">{t('topFeatures')}</p>
          {fallbackFeatures.map((f) => (
            <FeatureBar key={f.name} name={f.name} value={f.value} color={f.color} />
          ))}
        </div>
      )}
    </>
  );
}

export function FloodModelCard({ riskData, explanations }: Props) {
  const t = useTranslations('HazardModels');
  const score = riskData?.flood_score ?? 0;
  const badge = scoreBadge(score, t);
  const explanation = getExplanation(explanations, 'flood');

  return (
    <ModelCard
      title={t('flood')}
      subtitle={t('floodSubtitle')}
      methodology={t('floodMethod')}
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={7}
    >
      <HazardCardContent
        score={score}
        hazard="flood"
        explanation={explanation}

        fallbackFeatures={[
          { name: t('soilMoisture'), value: 85, color: '#3b82f6' },
          { name: t('precipitation24h'), value: 72, color: '#3b82f6' },
          { name: t('pressureTrend'), value: 58, color: '#3b82f6' },
        ]}
        statBoxes={[
          { label: t('model'), value: 'XGBoost' },
          { label: t('features'), value: '23' },
          { label: t('hazard'), value: t('danaFlood') },
        ]}
      />
    </ModelCard>
  );
}

export function WildfireModelCard({ riskData, explanations }: Props) {
  const t = useTranslations('HazardModels');
  const score = riskData?.wildfire_score ?? 0;
  const badge = scoreBadge(score, t);
  const explanation = getExplanation(explanations, 'wildfire');

  return (
    <ModelCard
      title={t('wildfire')}
      subtitle={t('wildfireSubtitle')}
      methodology={t('wildfireMethod')}
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={8}
    >
      <HazardCardContent
        score={score}
        hazard="wildfire"
        explanation={explanation}

        fallbackFeatures={[
          { name: t('dryDays'), value: 78, color: '#f97316' },
          { name: t('fwiIndex'), value: 65, color: '#f97316' },
          { name: t('uvIndex'), value: 52, color: '#f97316' },
        ]}
        statBoxes={[
          { label: t('models'), value: t('rfLgbm') },
          { label: t('features'), value: '20' },
          { label: t('system'), value: 'FWI' },
        ]}
      />
    </ModelCard>
  );
}

export function DroughtModelCard({ riskData, explanations }: Props) {
  const t = useTranslations('HazardModels');
  const score = riskData?.drought_score ?? 0;
  const badge = scoreBadge(score, t);
  const explanation = getExplanation(explanations, 'drought');

  return (
    <ModelCard
      title={t('drought')}
      subtitle={t('droughtSubtitle')}
      methodology={t('droughtMethod')}
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={9}
    >
      <HazardCardContent
        score={score}
        hazard="drought"
        explanation={explanation}

        fallbackFeatures={[
          { name: t('speiIndex'), value: 82, color: '#FBBF24' },
          { name: t('soilDeficit'), value: 68, color: '#FBBF24' },
          { name: t('lstmOutlook'), value: 55, color: '#FBBF24' },
        ]}
        statBoxes={[
          { label: t('model'), value: 'LSTM' },
          { label: t('sequence'), value: '90 days' },
          { label: t('index'), value: 'SPEI' },
        ]}
      />
    </ModelCard>
  );
}

export function HeatwaveModelCard({ riskData, explanations }: Props) {
  const t = useTranslations('HazardModels');
  const score = riskData?.heatwave_score ?? 0;
  const badge = scoreBadge(score, t);
  const explanation = getExplanation(explanations, 'heatwave');

  return (
    <ModelCard
      title={t('heatwave')}
      subtitle={t('heatwaveSubtitle')}
      methodology={t('heatwaveMethod')}
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={10}
    >
      <HazardCardContent
        score={score}
        hazard="heatwave"
        explanation={explanation}

        fallbackFeatures={[
          { name: t('wbgtTemp'), value: 88, color: '#ef4444' },
          { name: t('hotDays'), value: 70, color: '#ef4444' },
          { name: t('tempAnomaly'), value: 60, color: '#ef4444' },
        ]}
        statBoxes={[
          { label: t('model'), value: 'XGBoost' },
          { label: t('features'), value: '18' },
          { label: t('index'), value: 'WBGT' },
        ]}
      />
    </ModelCard>
  );
}

export function SeismicModelCard({ riskData, explanations }: Props) {
  const t = useTranslations('HazardModels');
  const score = riskData?.seismic_score ?? 0;
  const badge = scoreBadge(score, t);
  const explanation = getExplanation(explanations, 'seismic');

  return (
    <ModelCard
      title={t('seismic')}
      subtitle={t('seismicSubtitle')}
      methodology={t('seismicMethod')}
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={12}
    >
      <HazardCardContent
        score={score}
        hazard="seismic"
        explanation={explanation}

        fallbackFeatures={[
          { name: t('magnitude'), value: 75, color: '#a855f7' },
          { name: t('frequency'), value: 60, color: '#a855f7' },
          { name: t('proximity'), value: 50, color: '#a855f7' },
        ]}
        statBoxes={[
          { label: t('model'), value: t('ruleBased') },
          { label: t('features'), value: '8' },
          { label: t('source'), value: 'IGN' },
        ]}
      />
    </ModelCard>
  );
}

export function ColdwaveModelCard({ riskData, explanations }: Props) {
  const t = useTranslations('HazardModels');
  const score = riskData?.coldwave_score ?? 0;
  const badge = scoreBadge(score, t);
  const explanation = getExplanation(explanations, 'coldwave');

  return (
    <ModelCard
      title={t('coldwave')}
      subtitle={t('coldwaveSubtitle')}
      methodology={t('coldwaveMethod')}
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={13}
    >
      <HazardCardContent
        score={score}
        hazard="coldwave"
        explanation={explanation}

        fallbackFeatures={[
          { name: t('windChill'), value: 80, color: '#22D3EE' },
          { name: t('coldDays'), value: 65, color: '#22D3EE' },
          { name: t('elevation'), value: 48, color: '#22D3EE' },
        ]}
        statBoxes={[
          { label: t('model'), value: t('ruleBased') },
          { label: t('features'), value: '14' },
          { label: t('index'), value: t('windChillIdx') },
        ]}
      />
    </ModelCard>
  );
}

export function WindstormModelCard({ riskData, explanations }: Props) {
  const t = useTranslations('HazardModels');
  const score = riskData?.windstorm_score ?? 0;
  const badge = scoreBadge(score, t);
  const explanation = getExplanation(explanations, 'windstorm');

  return (
    <ModelCard
      title={t('windstorm')}
      subtitle={t('windstormSubtitle')}
      methodology={t('windstormMethod')}
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={14}
    >
      <HazardCardContent
        score={score}
        hazard="windstorm"
        explanation={explanation}

        fallbackFeatures={[
          { name: t('windSpeed'), value: 82, color: '#94a3b8' },
          { name: t('pressureDrop'), value: 68, color: '#94a3b8' },
          { name: t('gustIntensity'), value: 55, color: '#94a3b8' },
        ]}
        statBoxes={[
          { label: t('model'), value: t('ruleBased') },
          { label: t('features'), value: '14' },
          { label: t('system'), value: t('pressure') },
        ]}
      />
    </ModelCard>
  );
}

export function HazardOverviewChart({ riskData }: { riskData: HazardScore | null }) {
  const t = useTranslations('HazardModels');
  const [viewMode, setViewMode] = useState<'radar' | 'bar'>('radar');

  const chartData = useMemo(() => {
    if (!riskData) return [];
    return [
      { name: t('disasterFlood'), score: riskData.flood_score, fill: '#3b82f6' },
      { name: t('wildfire'), score: riskData.wildfire_score, fill: '#f97316' },
      { name: t('drought'), score: riskData.drought_score, fill: '#FBBF24' },
      { name: t('heatwave'), score: riskData.heatwave_score, fill: '#ef4444' },
      { name: t('seismic'), score: riskData.seismic_score, fill: '#a855f7' },
      { name: t('coldwave'), score: riskData.coldwave_score, fill: '#22D3EE' },
      { name: t('windstorm'), score: riskData.windstorm_score, fill: '#94a3b8' },
    ];
  }, [riskData, t]);

  if (!riskData) return null;

  return (
    <ModelCard
      title={t('overview')}
      subtitle={t('overviewSubtitle')}
      methodology={t('overviewMethod')}
      confidence={riskData.composite_score / 100}
      badge={{ label: `${riskData.composite_score.toFixed(0)} ${t('composite')}`, variant: riskData.composite_score >= 70 ? 'danger' : riskData.composite_score >= 50 ? 'warning' : 'info' }}
      index={11}
      className="lg:col-span-2"
    >
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setViewMode('radar')}
          className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            viewMode === 'radar' ? 'bg-accent-green/15 text-accent-green' : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
          }`}
        >
          {t('radarView')}
        </button>
        <button
          onClick={() => setViewMode('bar')}
          className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            viewMode === 'bar' ? 'bg-accent-green/15 text-accent-green' : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
          }`}
        >
          {t('barView')}
        </button>
      </div>

      {viewMode === 'radar' ? (
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
              stroke="rgba(255,255,255,0.06)"
            />
            <Radar
              name={t('riskScore')}
              dataKey="score"
              stroke="var(--color-accent-green)"
              fill="var(--color-accent-green)"
              fillOpacity={0.2}
              strokeWidth={2}
              animationDuration={800}
            />
            <Tooltip content={<DarkTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="score" name={t('riskScore')} radius={[4, 4, 0, 0]} animationDuration={800}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ModelCard>
  );
}
