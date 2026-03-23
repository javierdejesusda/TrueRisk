'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FloodZoneDetail } from '@/types/property';

interface FloodZoneCardProps {
  floodZone: FloodZoneDetail;
}

function riskLevelToSeverity(riskLevel: string | null): 1 | 2 | 3 | 4 | 5 {
  if (!riskLevel) return 1;
  const level = riskLevel.toLowerCase();
  if (level.includes('critical') || level.includes('critico')) return 5;
  if (level.includes('very') || level.includes('muy')) return 4;
  if (level.includes('high') || level.includes('alto')) return 3;
  if (level.includes('moderate') || level.includes('moderado')) return 2;
  return 1;
}

function formatZoneType(type: string | null): string {
  if (!type) return '-';
  const labels: Record<string, string> = {
    fluvial: 'Fluvial',
    pluvial: 'Pluvial',
    coastal: 'Costera',
  };
  return labels[type.toLowerCase()] ?? type;
}

export function FloodZoneCard({ floodZone }: FloodZoneCardProps) {
  const t = useTranslations('PropertyReport');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card variant="default" padding="lg" className="h-full">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-text-primary mb-4">
          {t('floodZone')}
        </h3>

        {floodZone.in_arpsi_zone ? (
          <div className="space-y-3">
            <Badge severity={riskLevelToSeverity(floodZone.risk_level)} size="md" pulse>
              {t('inFloodZone')}
            </Badge>

            {floodZone.zone_name && (
              <div>
                <p className="text-xs text-text-muted">{floodZone.zone_name}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-xs text-text-muted">{t('zoneType')}</p>
                <p className="text-sm text-text-primary font-medium mt-0.5">
                  {formatZoneType(floodZone.zone_type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">{t('returnPeriod')}</p>
                <p className="text-sm text-text-primary font-medium mt-0.5">
                  {floodZone.return_period ?? '-'}
                </p>
              </div>
            </div>

            {floodZone.risk_level && (
              <div className="mt-2">
                <p className="text-xs text-text-muted">Nivel de riesgo</p>
                <p className="text-sm text-text-primary font-medium mt-0.5 capitalize">
                  {floodZone.risk_level}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Badge variant="success" size="md">
              {t('notInFloodZone')}
            </Badge>

            {floodZone.distance_to_nearest_zone_m != null && (
              <div className="mt-3">
                <p className="text-xs text-text-muted">{t('distanceToZone')}</p>
                <p className="text-sm text-text-primary font-medium mt-0.5">
                  {floodZone.distance_to_nearest_zone_m >= 1000
                    ? `${(floodZone.distance_to_nearest_zone_m / 1000).toFixed(1)} km`
                    : `${Math.round(floodZone.distance_to_nearest_zone_m)} m`}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
