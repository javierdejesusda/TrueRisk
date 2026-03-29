'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

function Arrow() {
  return (
    <div className="flex items-center justify-center py-1 md:py-0 md:px-1">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="rotate-90 md:rotate-0">
        <path d="M4 10h12M12 6l4 4-4 4" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function PipelineDiagram() {
  const t = useTranslations('Predictions');

  const stages = [
    { label: t('pipelineDataSources'), items: [t('pipelineOpenMeteo'), t('pipelineAemetCap'), t('pipelineIgnSeismic')], color: '#3b82f6' },
    { label: t('pipelineFeatureEng'), items: [t('pipelineFloodFeatures'), t('pipelineWildfireFeatures'), t('pipelineHeatwaveFeatures'), t('pipelineLstmFeatures'), t('pipelineSeismicFeatures'), t('pipelineColdwaveFeatures'), t('pipelineWindstormFeatures')], color: '#8b5cf6' },
    { label: t('pipeline7Models'), items: [t('pipelineXgboostFlood'), t('pipelineRfWildfire'), t('pipelineSpeiDrought'), t('pipelineXgboostHeat'), t('pipelineRuleSeismic'), t('pipelineRuleCold'), t('pipelineRuleWind')], color: '#22c55e' },
    { label: t('pipelineComposite'), items: [t('pipelineDominant'), t('pipelineProvince'), t('pipelineSeverity')], color: '#f97316' },
  ];

  return (
    <div className="mt-8">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.15em] text-text-secondary mb-4 border-l-2 border-accent-green pl-3">
        {t('mlPipeline')}
      </h2>
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-1">
            {stages.map((stage, i) => (
              <div key={stage.label} className="contents">
                <motion.div
                  className="flex-1 min-w-0"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                >
                  <div className="rounded-lg border border-border p-3 h-full" style={{ borderColor: `${stage.color}30` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <p
                        className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: stage.color }}
                      >
                        {stage.label}
                      </p>
                    </div>
                    <ul className="space-y-0.5">
                      {stage.items.map((item) => (
                        <li key={item} className="font-[family-name:var(--font-mono)] text-[9px] text-text-muted">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
                {i < stages.length - 1 && <Arrow />}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
