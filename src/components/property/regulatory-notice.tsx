'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

export function RegulatoryNotice() {
  const t = useTranslations('PropertyReport');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card variant="default" padding="md" className="border-border/50">
        <div className="flex items-start gap-3">
          <svg
            className="w-4 h-4 text-text-muted shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold text-text-muted font-[family-name:var(--font-display)]">
              {t('regulatoryNotice')}
            </p>
            <p className="text-xs text-text-muted/70 mt-1 leading-relaxed font-[family-name:var(--font-sans)]">
              Este informe es compatible con los requisitos de la Orden ECM/599/2025, que exige la incorporacion de riesgos climaticos en las valoraciones inmobiliarias.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
