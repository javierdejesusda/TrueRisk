'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNarrative } from '@/hooks/use-narrative';
import { useAppStore } from '@/store/app-store';

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function RiskNarrative() {
  const t = useTranslations('Narrative');
  const locale = useAppStore((s) => s.locale);
  const { narrative, isLoading } = useNarrative();

  if (isLoading) {
    return (
      <Card variant="glass" padding="md">
        <Skeleton height="16px" width="140px" className="mb-3" />
        <Skeleton height="60px" className="mb-2" />
        <Skeleton height="12px" width="200px" />
      </Card>
    );
  }

  if (!narrative || !narrative.available) {
    return (
      <Card variant="glass" padding="md">
        <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-3">
          {t('morningBriefing')}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-muted">
          {t('unavailable')}
        </p>
      </Card>
    );
  }

  const content = locale === 'es' ? narrative.content_es : narrative.content_en;
  const isEmergency = narrative.type === 'emergency';

  return (
    <Card variant="glass" padding="md">
      <div className="flex items-center justify-between mb-3">
        <h2
          className={[
            'font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em]',
            isEmergency ? 'text-accent-red' : 'text-text-muted',
          ].join(' ')}
        >
          {isEmergency ? t('emergencyAlert') : t('morningBriefing')}
        </h2>
        {narrative.generated_at && (
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
            {t('generatedAt', { time: formatTimestamp(narrative.generated_at) })}
          </span>
        )}
      </div>

      <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed mb-3">
        {content}
      </p>

      <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted/60 italic">
        {t('aiDisclaimer')}
      </p>
    </Card>
  );
}
