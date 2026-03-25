'use client';

import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { Card } from '@/components/ui/card';
import type { GamificationBadge } from '@/hooks/use-gamification';
import {
  FileText,
  ShieldCheck,
  Trophy,
  Flame,
  Crown,
  Users,
  Rocket,
  Award,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'file-text': FileText,
  'shield-check': ShieldCheck,
  trophy: Trophy,
  flame: Flame,
  crown: Crown,
  users: Users,
  rocket: Rocket,
};

interface BadgesPanelProps {
  badges: GamificationBadge[];
  isLoading: boolean;
}

export function BadgesPanel({ badges, isLoading }: BadgesPanelProps) {
  const t = useTranslations('Gamification');
  const locale = useAppStore((s) => s.locale);
  const isEs = locale === 'es';

  if (isLoading) {
    return (
      <Card variant="glass" padding="md">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
          {t('badges')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>
      </Card>
    );
  }

  if (badges.length === 0) return null;

  return (
    <Card variant="glass" padding="md">
      <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
        {t('badges')}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {badges.map((badge) => {
          const IconComponent = ICON_MAP[badge.icon] ?? Award;
          const name = isEs ? badge.name_es : badge.name_en;
          const description = isEs ? badge.description_es : badge.description_en;

          return (
            <div
              key={badge.key}
              className={[
                'relative flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-200',
                badge.earned
                  ? 'glass-heavy border border-accent-green/20 shadow-[0_0_20px_rgba(34,197,94,0.06)]'
                  : 'bg-white/[0.03] border border-white/[0.04] opacity-45',
              ].join(' ')}
              title={description}
            >
              <div
                className={[
                  'flex items-center justify-center w-10 h-10 rounded-full',
                  badge.earned
                    ? 'bg-accent-green/15 text-accent-green'
                    : 'bg-white/[0.05] text-text-muted',
                ].join(' ')}
              >
                <IconComponent size={20} />
              </div>
              <span
                className={[
                  'text-xs font-semibold leading-tight',
                  badge.earned ? 'text-text-primary' : 'text-text-muted',
                ].join(' ')}
              >
                {name}
              </span>
              <span
                className={[
                  'text-[10px]',
                  badge.earned ? 'text-accent-green' : 'text-text-muted/60',
                ].join(' ')}
              >
                {badge.earned ? t('earned') : t('locked')}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
