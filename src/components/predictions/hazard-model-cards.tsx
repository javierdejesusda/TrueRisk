'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { ModelCard } from './model-card';
import { DarkTooltip, StatBox, SemiCircleGauge } from './shared';

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
}

function scoreBadge(score: number): { label: string; variant: 'danger' | 'warning' | 'info' | 'success' } {
  if (score >= 70) return { label: 'High Risk', variant: 'danger' };
  if (score >= 50) return { label: 'Moderate Risk', variant: 'warning' };
  if (score >= 30) return { label: 'Low Risk', variant: 'info' };
  return { label: 'Minimal', variant: 'success' };
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

function HazardCardContent({ score, features, statBoxes }: {
  score: number;
  features: { name: string; value: number; color: string }[];
  statBoxes: { label: string; value: string }[];
}) {
  return (
    <>
      <SemiCircleGauge value={score} label="Risk Score" />
      <div className="grid grid-cols-3 gap-2 mt-3">
        {statBoxes.map((box) => (
          <StatBox key={box.label} label={box.label} value={box.value} />
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider">Top features</p>
        {features.map((f) => (
          <FeatureBar key={f.name} name={f.name} value={f.value} color={f.color} />
        ))}
      </div>
    </>
  );
}

export function FloodModelCard({ riskData }: Props) {
  const score = riskData?.flood_score ?? 0;
  const badge = scoreBadge(score);

  return (
    <ModelCard
      title="Flash Floods / DANA"
      subtitle="XGBoost classifier — 23 features"
      methodology="Gradient-boosted decision tree trained on historical DANA events. Ingests 23 features including soil moisture, pressure trends, 6h/24h/48h accumulated precipitation, river basin risk indices, and Mediterranean coastal exposure. Outputs calibrated flood probability."
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={7}
    >
      <HazardCardContent
        score={score}
        features={[
          { name: 'Soil moisture', value: 85, color: '#3b82f6' },
          { name: 'Precipitation 24h', value: 72, color: '#3b82f6' },
          { name: 'Pressure trend', value: 58, color: '#3b82f6' },
        ]}
        statBoxes={[
          { label: 'Model', value: 'XGBoost' },
          { label: 'Features', value: '23' },
          { label: 'Hazard', value: 'DANA/Flood' },
        ]}
      />
    </ModelCard>
  );
}

export function WildfireModelCard({ riskData }: Props) {
  const score = riskData?.wildfire_score ?? 0;
  const badge = scoreBadge(score);

  return (
    <ModelCard
      title="Wildfires"
      subtitle="RF + LightGBM ensemble — Canadian FWI"
      methodology="Ensemble of Random Forest and LightGBM classifiers using the Canadian Fire Weather Index system (FFMC, DMC, DC, ISI, BUI, FWI). 20 features include consecutive dry days, soil moisture, UV index, and elevation. Outputs are averaged and optionally Platt-calibrated for reliable probabilities."
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={8}
    >
      <HazardCardContent
        score={score}
        features={[
          { name: 'Dry days', value: 78, color: '#f97316' },
          { name: 'FWI index', value: 65, color: '#f97316' },
          { name: 'UV index', value: 52, color: '#f97316' },
        ]}
        statBoxes={[
          { label: 'Models', value: 'RF + LGBM' },
          { label: 'Features', value: '20' },
          { label: 'System', value: 'FWI' },
        ]}
      />
    </ModelCard>
  );
}

export function DroughtModelCard({ riskData }: Props) {
  const score = riskData?.drought_score ?? 0;
  const badge = scoreBadge(score);

  return (
    <ModelCard
      title="Drought"
      subtitle="SPEI/SPI indices + LSTM trajectory"
      methodology="Two-stage model: first computes SPEI (Standardised Precipitation-Evapotranspiration Index) at 1-month and 3-month scales to quantify current drought severity. Then an LSTM neural network predicts 30-day drought trajectory from 90-day sequences of temperature, precipitation, soil moisture, and humidity. Composite score blends SPEI severity, LSTM outlook, and soil-moisture deficit."
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={9}
    >
      <HazardCardContent
        score={score}
        features={[
          { name: 'SPEI index', value: 82, color: '#FBBF24' },
          { name: 'Soil deficit', value: 68, color: '#FBBF24' },
          { name: 'LSTM outlook', value: 55, color: '#FBBF24' },
        ]}
        statBoxes={[
          { label: 'Model', value: 'LSTM' },
          { label: 'Sequence', value: '90 days' },
          { label: 'Index', value: 'SPEI' },
        ]}
      />
    </ModelCard>
  );
}

export function HeatwaveModelCard({ riskData }: Props) {
  const score = riskData?.heatwave_score ?? 0;
  const badge = scoreBadge(score);

  return (
    <ModelCard
      title="Heatwaves"
      subtitle="XGBoost + WBGT heat stress index"
      methodology="XGBoost classifier trained on 18 features including Wet Bulb Globe Temperature (WBGT) for heat stress, consecutive hot days/nights tracking, temperature anomalies, 48h max temperature forecasts, and geographic factors (latitude, elevation, coastal exposure). Models health-impact risk from sustained extreme heat."
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={10}
    >
      <HazardCardContent
        score={score}
        features={[
          { name: 'WBGT temp', value: 88, color: '#ef4444' },
          { name: 'Hot days', value: 70, color: '#ef4444' },
          { name: 'Temp anomaly', value: 60, color: '#ef4444' },
        ]}
        statBoxes={[
          { label: 'Model', value: 'XGBoost' },
          { label: 'Features', value: '18' },
          { label: 'Index', value: 'WBGT' },
        ]}
      />
    </ModelCard>
  );
}

export function SeismicModelCard({ riskData }: Props) {
  const score = riskData?.seismic_score ?? 0;
  const badge = scoreBadge(score);

  return (
    <ModelCard
      title="Seismic / Earthquake"
      subtitle="Rule-based — IGN seismic catalog"
      methodology="Analyzes recent seismic activity from Spain's IGN catalog within 200km of the province. Considers earthquake magnitude, frequency, proximity, and depth. Shallow M4+ earthquakes near populated areas drive the highest scores. Province seismic zone weights reflect the Betic Cordillera fault system exposure."
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={12}
    >
      <HazardCardContent
        score={score}
        features={[
          { name: 'Magnitude', value: 75, color: '#a855f7' },
          { name: 'Frequency', value: 60, color: '#a855f7' },
          { name: 'Proximity', value: 50, color: '#a855f7' },
        ]}
        statBoxes={[
          { label: 'Model', value: 'Rule-based' },
          { label: 'Features', value: '8' },
          { label: 'Source', value: 'IGN' },
        ]}
      />
    </ModelCard>
  );
}

export function ColdwaveModelCard({ riskData }: Props) {
  const score = riskData?.coldwave_score ?? 0;
  const badge = scoreBadge(score);

  return (
    <ModelCard
      title="Cold Waves / Filomena"
      subtitle="Rule-based — wind chill + persistence"
      methodology="Tracks wind chill temperature, consecutive cold days (max <5C) and cold nights (min <0C), elevation, and inland exposure. Designed to detect Filomena-type events where sustained sub-zero temperatures and snowfall paralyze infrastructure. Seasonal damping reduces scores in warm months."
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={13}
    >
      <HazardCardContent
        score={score}
        features={[
          { name: 'Wind chill', value: 80, color: '#22D3EE' },
          { name: 'Cold days', value: 65, color: '#22D3EE' },
          { name: 'Elevation', value: 48, color: '#22D3EE' },
        ]}
        statBoxes={[
          { label: 'Model', value: 'Rule-based' },
          { label: 'Features', value: '14' },
          { label: 'Index', value: 'Wind Chill' },
        ]}
      />
    </ModelCard>
  );
}

export function WindstormModelCard({ riskData }: Props) {
  const score = riskData?.windstorm_score ?? 0;
  const badge = scoreBadge(score);

  return (
    <ModelCard
      title="Windstorms / DANA Winds"
      subtitle="Rule-based — wind + pressure dynamics"
      methodology="Analyzes sustained wind speed, gust intensity, and barometric pressure dynamics. Rapid pressure drops signal approaching storm systems. Coastal provinces and Mediterranean areas during autumn DANA season receive elevated scores. Tracks galernas (sudden Cantabrian storms) and Atlantic low-pressure events."
      confidence={score / 100}
      badge={{ label: badge.label, variant: badge.variant }}
      index={14}
    >
      <HazardCardContent
        score={score}
        features={[
          { name: 'Wind speed', value: 82, color: '#FFFFFF' },
          { name: 'Pressure drop', value: 68, color: '#FFFFFF' },
          { name: 'Gust intensity', value: 55, color: '#FFFFFF' },
        ]}
        statBoxes={[
          { label: 'Model', value: 'Rule-based' },
          { label: 'Features', value: '14' },
          { label: 'System', value: 'Pressure' },
        ]}
      />
    </ModelCard>
  );
}

export function HazardOverviewChart({ riskData }: Props) {
  const [viewMode, setViewMode] = useState<'radar' | 'bar'>('radar');

  if (!riskData) return null;

  const chartData = [
    { name: 'Flood', score: riskData.flood_score, fill: '#3b82f6' },
    { name: 'Wildfire', score: riskData.wildfire_score, fill: '#f97316' },
    { name: 'Drought', score: riskData.drought_score, fill: '#FBBF24' },
    { name: 'Heatwave', score: riskData.heatwave_score, fill: '#ef4444' },
    { name: 'Seismic', score: riskData.seismic_score, fill: '#a855f7' },
    { name: 'Cold Wave', score: riskData.coldwave_score, fill: '#22D3EE' },
    { name: 'Windstorm', score: riskData.windstorm_score, fill: '#FFFFFF' },
  ];

  return (
    <ModelCard
      title="Hazard Overview"
      subtitle="Composite risk from all ML models"
      methodology="Aggregates predictions from all seven hazard-specific models (Flood XGBoost, Wildfire RF+LightGBM, Drought SPEI+LSTM, Heatwave XGBoost, Seismic IGN, Cold Wave wind chill, Windstorm pressure dynamics) into a single composite risk score. The dominant hazard is identified as the highest individual score."
      confidence={riskData.composite_score / 100}
      badge={{ label: `${riskData.composite_score.toFixed(0)} Composite`, variant: riskData.composite_score >= 70 ? 'danger' : riskData.composite_score >= 50 ? 'warning' : 'info' }}
      index={11}
      className="lg:col-span-2"
    >
      {/* View toggle */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setViewMode('radar')}
          className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            viewMode === 'radar' ? 'bg-accent-green/15 text-accent-green' : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
          }`}
        >
          Radar
        </button>
        <button
          onClick={() => setViewMode('bar')}
          className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            viewMode === 'bar' ? 'bg-accent-green/15 text-accent-green' : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
          }`}
        >
          Bars
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
              name="Risk Score"
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
            <Bar dataKey="score" name="Risk Score" radius={[4, 4, 0, 0]} animationDuration={800}>
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
