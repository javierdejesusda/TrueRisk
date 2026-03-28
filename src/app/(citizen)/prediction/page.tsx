'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useRiskScore } from '@/hooks/use-risk-score';
import { useRiskExplain } from '@/hooks/use-risk-explain';
import { usePredictions } from '@/hooks/use-predictions';
import { PredictionHeader } from '@/components/predictions/prediction-header';
import { PredictionsExplainer } from '@/components/predictions/predictions-explainer';
import { GumbelChart } from '@/components/predictions/gumbel-chart';
import { RegressionChart } from '@/components/predictions/regression-chart';
import { BayesianChart } from '@/components/predictions/bayesian-chart';
import { EmaChart } from '@/components/predictions/ema-chart';
import { ZScoreChart } from '@/components/predictions/zscore-chart';
import { DecisionTreeCard } from '@/components/predictions/decision-tree-card';
import { KnnMatches } from '@/components/predictions/knn-matches';
import { FloodModelCard, WildfireModelCard, DroughtModelCard, HeatwaveModelCard, SeismicModelCard, ColdwaveModelCard, WindstormModelCard, HazardOverviewChart } from '@/components/predictions/hazard-model-cards';
import { ModelInfoPanel } from '@/components/predictions/model-info-panel';
import { PipelineDiagram } from '@/components/predictions/pipeline-diagram';
import { LoadingSkeleton } from '@/components/predictions/shared';
import { useForecast } from '@/hooks/use-forecast';
import { ForecastChart } from '@/components/predictions/forecast-chart';
import { AttentionWeightsChart } from '@/components/predictions/attention-weights-chart';
import { AiWeatherSummary } from '@/components/predictions/ai-weather-summary';
import { HydroNowcastCard } from '@/components/predictions/hydro-nowcast-card';
import { PROVINCES } from '@/lib/provinces';
import { useTranslations } from 'next-intl';

export default function PredictionPage() {
  const t = useTranslations('Predictions');
  const tCommon = useTranslations('Common');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);
  const { risk } = useRiskScore();
  const { data: explainData } = useRiskExplain();
  const { data, isLoading, error, refresh } = usePredictions();
  const { data: forecastData, isLoading: forecastLoading } = useForecast();

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data) {
    const provinceName = PROVINCES.find(p => p.code === provinceCode)?.name ?? provinceCode;
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-red/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <p className="text-sm text-text-muted">
          {error ?? t('noPredictionData', { province: provinceName })}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()}>{tCommon('retry')}</Button>
          <Button variant="outline" size="sm" onClick={() => setProvinceCode('28')}>{t('tryMadrid')}</Button>
        </div>
      </div>
    );
  }

  const riskData = risk ? {
    flood_score: risk.flood_score,
    wildfire_score: risk.wildfire_score,
    drought_score: risk.drought_score,
    heatwave_score: risk.heatwave_score,
    seismic_score: risk.seismic_score,
    coldwave_score: risk.coldwave_score,
    windstorm_score: risk.windstorm_score,
    composite_score: risk.composite_score,
    dominant_hazard: risk.dominant_hazard,
    severity: risk.severity,
  } : null;

  const explanations = explainData?.hazards;

  return (
    <motion.div
      className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-7xl mx-auto overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, staggerChildren: 0.05 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <select
          value={provinceCode}
          onChange={(e) => setProvinceCode(e.target.value)}
          className="glass-heavy rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-sans)] text-text-primary bg-transparent border border-border focus:border-accent-green outline-none cursor-pointer"
        >
          {PROVINCES.map(p => (
            <option key={p.code} value={p.code} className="bg-bg-secondary">{p.name}</option>
          ))}
        </select>
        <span className="text-xs font-[family-name:var(--font-sans)] text-text-muted">{t('provinceAnalysis')}</span>
      </div>
      <PredictionHeader current={data.current} />

      {/* Multi-Horizon Risk Forecast (TFT + GNN) */}
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.15em] text-text-secondary mt-8 mb-4 border-l-2 border-accent-green pl-3">{t('forecastTitle')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <ForecastChart data={forecastData} isLoading={forecastLoading} />
        <AttentionWeightsChart data={forecastData} />
      </div>

      {/* Hazard ML Models */}
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.15em] text-text-secondary mt-8 mb-4 border-l-2 border-accent-green pl-3">{t('modelInventory')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <FloodModelCard riskData={riskData} explanations={explanations} />
        <WildfireModelCard riskData={riskData} explanations={explanations} />
        <DroughtModelCard riskData={riskData} explanations={explanations} />
        <HeatwaveModelCard riskData={riskData} explanations={explanations} />
        <SeismicModelCard riskData={riskData} explanations={explanations} />
        <ColdwaveModelCard riskData={riskData} explanations={explanations} />
        <WindstormModelCard riskData={riskData} explanations={explanations} />
        <HazardOverviewChart riskData={riskData} />
      </div>

      {/* Hydrological Nowcast */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        <HydroNowcastCard />
      </div>

      {/* AI Weather Summary */}
      <AiWeatherSummary />

      {/* Model Registry */}
      <ModelInfoPanel />

      {/* Statistical Models */}
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.15em] text-text-secondary mt-8 mb-4 border-l-2 border-accent-green pl-3">{t('statisticalMethods')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <GumbelChart data={data.gumbel} />
        <RegressionChart data={data.regression} />
        <BayesianChart data={data.bayesian} />
        <EmaChart data={data.ema} />
        <ZScoreChart data={data.zScore} />
        <DecisionTreeCard data={data.decisionTree} />
        <KnnMatches data={data.knn} />
      </div>

      {/* ML Pipeline & Methodology */}
      <PipelineDiagram />
      <PredictionsExplainer />
    </motion.div>
  );
}
