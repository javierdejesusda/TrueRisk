'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import type { DroughtClassification } from '@/hooks/use-drought-dashboard';

// Map classification labels to i18n keys
const LABEL_TO_I18N: Record<string, string> = {
  Normal: 'normal',
  'Abnormally Dry': 'abnormallyDry',
  'Moderate Drought': 'moderate',
  'Severe Drought': 'severe',
  'Extreme Drought': 'extreme',
  'Exceptional Drought': 'exceptional',
};

interface DroughtClassificationCardProps {
  classification: DroughtClassification;
  spei1m: number;
  spei3m: number;
  droughtScore: number;
}

export function DroughtClassificationCard({
  classification,
  spei1m,
  spei3m,
  droughtScore,
}: DroughtClassificationCardProps) {
  const t = useTranslations('Drought');

  const i18nKey = LABEL_TO_I18N[classification.label] ?? 'normal';

  return (
    <Card variant="glass" padding="md">
      <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-4">
        {t('classification')}
      </h2>

      {/* Classification badge */}
      <div className="flex items-center gap-3 mb-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center w-14 h-14 rounded-2xl text-lg font-extrabold font-[family-name:var(--font-display)]"
          style={{ backgroundColor: `${classification.color}20`, color: classification.color }}
        >
          {classification.class}
        </motion.div>
        <div>
          <p
            className="font-[family-name:var(--font-display)] text-base font-bold"
            style={{ color: classification.color }}
          >
            {t(i18nKey)}
          </p>
          <p className="font-[family-name:var(--font-sans)] text-xs text-text-secondary">
            {t('spei3m')}: {spei3m.toFixed(2)}
          </p>
        </div>
      </div>

      {/* SPEI metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <p className="font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            {t('spei1m')}
          </p>
          <p className="font-[family-name:var(--font-mono)] text-lg font-bold text-text-primary tabular-nums">
            {spei1m.toFixed(2)}
          </p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            {t('spei3m')}
          </p>
          <p className="font-[family-name:var(--font-mono)] text-lg font-bold text-text-primary tabular-nums">
            {spei3m.toFixed(2)}
          </p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            {t('droughtScore')}
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-[family-name:var(--font-mono)] text-lg font-bold tabular-nums"
            style={{ color: classification.color }}
          >
            {Math.round(droughtScore)}
          </motion.p>
        </div>
      </div>
    </Card>
  );
}
