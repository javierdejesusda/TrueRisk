'use client';

import { Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface MaintenanceCardProps {
  feature?: string;
  className?: string;
}

export function MaintenanceCard({ feature, className = '' }: MaintenanceCardProps) {
  const t = useTranslations('maintenance');

  return (
    <div
      role="status"
      className={[
        'relative overflow-hidden rounded-2xl',
        'border border-[var(--color-border-hover)]',
        'bg-[var(--color-bg-card)]',
        'p-6',
        'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.5)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Subtle top accent stripe using the yellow severity token */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-yellow)]/30 to-transparent"
      />

      <div className="flex items-start gap-4">
        {/* Icon container */}
        <div
          aria-hidden="true"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border-hover)] bg-[var(--color-bg-secondary)]"
        >
          <Wrench
            className="h-4 w-4 text-[var(--color-accent-yellow)]"
            strokeWidth={1.75}
          />
        </div>

        {/* Text block */}
        <div className="min-w-0 flex-1">
          <p
            className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-[var(--color-text-primary)]"
          >
            {t('title')}
          </p>
          <p className="mt-1.5 font-[family-name:var(--font-sans)] text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {feature
              ? t('featureBody', { feature })
              : t('body')}
          </p>
        </div>
      </div>
    </div>
  );
}
