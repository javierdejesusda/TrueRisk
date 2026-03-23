'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import type { WildfireProximityDetail, TerrainDetail } from '@/types/property';

interface WildfireProximityCardProps {
  wildfireProximity: WildfireProximityDetail;
  terrain: TerrainDetail;
}

export function WildfireProximityCard({
  wildfireProximity,
  terrain,
}: WildfireProximityCardProps) {
  const t = useTranslations('PropertyReport');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card variant="default" padding="lg" className="h-full">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-text-primary mb-4">
          {t('wildfireAnalysis')}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted">{t('elevation')}</p>
            <p className="text-sm text-text-primary font-medium mt-0.5">
              {terrain.elevation_m.toFixed(0)} m
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">{t('slope')}</p>
            <p className="text-sm text-text-primary font-medium mt-0.5">
              {terrain.slope_pct.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">{t('modifier')}</p>
            <p className="text-sm text-text-primary font-mono font-semibold mt-0.5">
              x{wildfireProximity.modifier.toFixed(2)}
            </p>
          </div>
        </div>

        {wildfireProximity.explanation && (
          <p className="mt-4 text-xs text-text-muted leading-relaxed font-[family-name:var(--font-sans)]">
            {wildfireProximity.explanation}
          </p>
        )}
      </Card>
    </motion.div>
  );
}
