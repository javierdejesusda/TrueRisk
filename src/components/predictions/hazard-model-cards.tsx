'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar } from 'recharts';
import { ModelCard } from './model-card';
import { DarkTooltip, StatBox } from './shared';

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

function scoreColor(score: number): string {
  if (score >= 70) return '#EF4444';
  if (score >= 50) return '#F97316';
  if (score >= 30) return '#FBBF24';
  return '#22F58C';
}

function scoreBadge(score: number): { label: string; variant: 'danger' | 'warning' | 'info' | 'success' } {
  if (score >= 70) return { label: 'High Risk', variant: 'danger' };
  if (score >= 50) return { label: 'Moderate Risk', variant: 'warning' };
  if (score >= 30) return { label: 'Low Risk', variant: 'info' };
  return { label: 'Minimal', variant: 'success' };
}

function RadialScore({ score }: { score: number }) {
  const radialData = [{ name: 'Risk', value: score, fill: scoreColor(score) }];
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={100} height={100}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'rgba(255,255,255,0.06)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold font-[family-name:var(--font-mono)]" style={{ color: scoreColor(score) }}>
          {score.toFixed(0)}
        </span>
        <span className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase">Risk Score</span>
      </div>
    </div>
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
      <RadialScore score={score} />
      <div className="grid grid-cols-3 gap-2 mt-3">
        <StatBox label="Model" value="XGBoost" />
        <StatBox label="Features" value="23" />
        <StatBox label="Hazard" value="DANA/Flood" />
      </div>
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
      <RadialScore score={score} />
      <div className="grid grid-cols-3 gap-2 mt-3">
        <StatBox label="Models" value="RF + LGBM" />
        <StatBox label="Features" value="20" />
        <StatBox label="System" value="FWI" />
      </div>
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
      <RadialScore score={score} />
      <div className="grid grid-cols-3 gap-2 mt-3">
        <StatBox label="Model" value="LSTM" />
        <StatBox label="Sequence" value="90 days" />
        <StatBox label="Index" value="SPEI" />
      </div>
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
      <RadialScore score={score} />
      <div className="grid grid-cols-3 gap-2 mt-3">
        <StatBox label="Model" value="XGBoost" />
        <StatBox label="Features" value="18" />
        <StatBox label="Index" value="WBGT" />
      </div>
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
      <RadialScore score={score} />
      <div className="grid grid-cols-3 gap-2 mt-3">
        <StatBox label="Model" value="Rule-based" />
        <StatBox label="Features" value="8" />
        <StatBox label="Source" value="IGN" />
      </div>
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
      <RadialScore score={score} />
      <div className="grid grid-cols-3 gap-2 mt-3">
        <StatBox label="Model" value="Rule-based" />
        <StatBox label="Features" value="14" />
        <StatBox label="Index" value="Wind Chill" />
      </div>
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
      <RadialScore score={score} />
      <div className="grid grid-cols-3 gap-2 mt-3">
        <StatBox label="Model" value="Rule-based" />
        <StatBox label="Features" value="14" />
        <StatBox label="System" value="Pressure" />
      </div>
    </ModelCard>
  );
}

export function HazardOverviewChart({ riskData }: Props) {
  if (!riskData) return null;

  const chartData = [
    { name: 'Flood', score: riskData.flood_score, fill: '#3b82f6' },
    { name: 'Wildfire', score: riskData.wildfire_score, fill: '#f97316' },
    { name: 'Drought', score: riskData.drought_score, fill: '#FBBF24' },
    { name: 'Heatwave', score: riskData.heatwave_score, fill: '#ef4444' },
    { name: 'Seismic', score: riskData.seismic_score, fill: '#a855f7' },
    { name: 'Cold Wave', score: riskData.coldwave_score, fill: '#22D3EE' },
    { name: 'Windstorm', score: riskData.windstorm_score, fill: '#22F58C' },
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
    </ModelCard>
  );
}
