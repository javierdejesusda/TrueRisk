'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';

// ── Inline SVG Icons ────────────────────────────────────────────────

function WeatherStationIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M8 6h8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
    </svg>
  );
}

function SatelliteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7L9 3 5 7l4 4" />
      <path d="M17 11l4 4-4 4-4-4" />
      <path d="M8 12l4 4" />
      <path d="M3 21l4.5-4.5" />
      <circle cx="5.5" cy="18.5" r="1.5" />
    </svg>
  );
}

function SeismographIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16h3l2-8 3 14 3-10 2 4h7" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: expanded ? 180 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      <polyline points="6 8 10 12 14 8" />
    </motion.svg>
  );
}

// ── Section heading ─────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

// ── Data Sources ────────────────────────────────────────────────────

function DataSourcesSection() {
  const t = useTranslations('Predictions');

  const dataSources = [
    { icon: <WeatherStationIcon />, label: t('aemet'), desc: t('aemetDesc') },
    { icon: <SatelliteIcon />, label: t('satellite'), desc: t('satelliteDesc') },
    { icon: <SeismographIcon />, label: t('ign'), desc: t('ignDesc') },
    { icon: <DatabaseIcon />, label: t('historicalDb'), desc: t('historicalDesc') },
  ];

  return (
    <div>
      <SectionHeading>{t('dataSources')}</SectionHeading>
      <div className="grid grid-cols-2 gap-2">
        {dataSources.map((src) => (
          <div
            key={src.label}
            className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] p-3"
          >
            <div className="shrink-0 text-text-muted mt-0.5">{src.icon}</div>
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-sans)] text-[11px] font-medium text-text-primary leading-tight">
                {src.label}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted leading-snug mt-0.5">
                {src.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ML Pipeline ─────────────────────────────────────────────────────

function MLPipelineSection() {
  const t = useTranslations('Predictions');

  const pipelineSteps = [
    { num: '01', title: t('step1'), detail: t('step1Desc') },
    { num: '02', title: t('step2'), detail: t('step2Desc') },
    { num: '03', title: t('step3'), detail: t('step3Desc') },
  ];

  return (
    <div>
      <SectionHeading>{t('mlPipeline')}</SectionHeading>
      <div className="flex items-stretch gap-0">
        {pipelineSteps.map((step, i) => (
          <div key={step.num} className="flex items-stretch flex-1 min-w-0">
            {/* Step card */}
            <div className="rounded-xl bg-bg-secondary p-3 flex-1 min-w-0">
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                {step.num}
              </span>
              <p className="font-[family-name:var(--font-sans)] text-[11px] font-medium text-text-primary leading-tight mt-1">
                {step.title}
              </p>
              <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted leading-snug mt-1">
                {step.detail}
              </p>
            </div>
            {/* Connecting arrow */}
            {i < pipelineSteps.length - 1 && (
              <div className="flex items-center px-1.5 shrink-0">
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="text-text-muted">
                  <path d="M0 6h12M10 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Model Inventory ─────────────────────────────────────────────────

function ModelInventorySection() {
  const t = useTranslations('Predictions');
  const tHaz = useTranslations('HazardModels');

  const models = [
    { hazard: tHaz('disasterFlood'), model: 'XGBoost', features: '23 features', basis: 'DANA', color: '#3b82f6' },
    { hazard: tHaz('wildfire'), model: 'RF + LightGBM', features: '20 features', basis: 'FWI', color: '#f97316' },
    { hazard: tHaz('drought'), model: 'LSTM', features: 'SPEI indices', basis: '90-day sequences', color: '#eab308' },
    { hazard: tHaz('heatwave'), model: 'XGBoost', features: '18 features', basis: 'WBGT', color: '#ef4444' },
    { hazard: tHaz('seismic'), model: 'Rule-based', features: 'IGN catalog', basis: '200 km radius', color: '#a855f7' },
    { hazard: tHaz('coldwave'), model: 'Rule-based', features: 'Wind chill', basis: 'Persistence tracking', color: '#22d3ee' },
    { hazard: tHaz('windstorm'), model: 'Rule-based', features: 'Pressure dynamics', basis: 'Gust intensity', color: '#94a3b8' },
  ];

  return (
    <div>
      <SectionHeading>{t('modelInventory')}</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {models.map((m) => (
          <div key={m.hazard} className="rounded-xl bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <span className="font-[family-name:var(--font-display)] text-[11px] font-semibold text-text-primary">
                {m.hazard}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-secondary">
                {m.model}
              </span>
              <span className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted">
                {m.features}
              </span>
              <span className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted">
                {m.basis}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Statistical Methods ─────────────────────────────────────────────

function StatisticalMethodsSection() {
  const t = useTranslations('Predictions');
  const tStat = useTranslations('StatisticalModels');

  const methods = [
    { name: tStat('gumbelEvd'), desc: tStat('explainerGumbel') },
    { name: tStat('linearRegression'), desc: tStat('explainerRegression') },
    { name: tStat('bayesianClassification'), desc: tStat('explainerBayesian') },
    { name: tStat('emaSmoothing'), desc: tStat('explainerEma') },
    { name: tStat('zscoreAnomaly'), desc: tStat('explainerZscore') },
    { name: tStat('decisionTrees'), desc: tStat('explainerDecisionTree') },
    { name: tStat('knnMatching'), desc: tStat('explainerKnn') },
  ];

  return (
    <div>
      <SectionHeading>{t('statisticalMethods')}</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {methods.map((m) => (
          <div key={m.name} className="rounded-xl bg-white/[0.03] p-3">
            <p className="font-[family-name:var(--font-mono)] text-[11px] font-medium text-text-primary mb-0.5">
              {m.name}
            </p>
            <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted leading-snug">
              {m.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export function PredictionsExplainer() {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations('Predictions');

  return (
    <Card variant="glass" className="mt-6 mb-2">
      <div className="flex flex-col gap-3">
        {/* ── Hero (always visible) ─────────────────────────────── */}
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-text-primary">
            {t('howItWorks')}
          </h2>
          <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary mt-1 leading-relaxed">
            {t('explainerSummary')}
          </p>
        </div>

        {/* ── Toggle button ─────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 self-start cursor-pointer rounded-lg px-2.5 py-1 -ml-1 text-text-muted hover:text-text-secondary transition-colors duration-150 bg-transparent"
        >
          <span className="font-[family-name:var(--font-sans)] text-[11px] font-medium select-none">
            {expanded ? t('hideDetails') : t('showMethodology')}
          </span>
          <ChevronIcon expanded={expanded} />
        </button>

        {/* ── Expandable panel ──────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="explainer-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-6 pt-2 pb-1">
                {/* a. Data Sources */}
                <DataSourcesSection />

                {/* b. ML Pipeline */}
                <MLPipelineSection />

                {/* c. Model Inventory */}
                <ModelInventorySection />

                {/* d. Statistical Methods */}
                <StatisticalMethodsSection />

                {/* e. Limitations Disclaimer */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3">
                  <p className="font-[family-name:var(--font-display)] text-[10px] text-text-muted uppercase tracking-wider mb-1">
                    {t('limitations')}
                  </p>
                  <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted leading-relaxed">
                    {t('limitationsText')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
