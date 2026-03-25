'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Flame, Trophy, Star } from 'lucide-react';

interface StreakWidgetProps {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  isLoading: boolean;
}

export function StreakWidget({
  totalPoints,
  currentStreak,
  longestStreak,
  isLoading,
}: StreakWidgetProps) {
  const t = useTranslations('Gamification');

  if (isLoading) {
    return (
      <Card variant="glass" padding="md">
        <div className="flex items-center justify-between gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 w-24 rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="md">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Current streak */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-orange/15 shrink-0">
            <Flame size={18} className="text-accent-orange" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-text-primary tabular-nums leading-tight">
              {t('days', { count: currentStreak })}
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">
              {t('streak')}
            </p>
          </div>
        </div>

        {/* Longest streak */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-purple/15 shrink-0">
            <Trophy size={18} className="text-accent-purple" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-text-primary tabular-nums leading-tight">
              {t('days', { count: longestStreak })}
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">
              {t('longestStreak')}
            </p>
          </div>
        </div>

        {/* Total points */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-green/15 shrink-0">
            <Star size={18} className="text-accent-green" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-text-primary tabular-nums leading-tight">
              {t('totalPoints', { points: totalPoints })}
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">
              {t('points')}
            </p>
          </div>
        </div>
      </div>

      {/* Motivational message for active streaks */}
      {currentStreak >= 3 && (
        <p className="mt-3 text-xs text-accent-green text-center font-medium">
          {t('keepItUp')}
        </p>
      )}
    </Card>
  );
}
