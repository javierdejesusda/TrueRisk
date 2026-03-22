'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { usePreparedness } from '@/hooks/use-preparedness';
import { Shield } from 'lucide-react';

function getScoreColor(score: number): string {
  if (score <= 30) return '#ef4444';
  if (score <= 60) return '#f59e0b';
  return '#22c55e';
}

export function PreparednessWidget() {
  const t = useTranslations('Preparedness');
  const { score, isLoading } = usePreparedness();

  if (isLoading) {
    return (
      <Card variant="glass" padding="md">
        <div className="h-20 animate-[shimmer_1.5s_infinite] rounded-lg bg-bg-secondary" />
      </Card>
    );
  }

  const totalScore = score?.total_score ?? 0;
  const nextActions = score?.next_actions ?? [];
  const color = getScoreColor(totalScore);

  const radius = 28;
  const strokeWidth = 5;
  const circumference = Math.PI * radius;
  const fillPercent = Math.min(totalScore / 100, 1);
  const dashOffset = circumference * (1 - fillPercent);

  return (
    <Card variant="glass" padding="md" hoverable>
      <Link href="/preparedness" className="flex items-center gap-4">
        {/* Mini gauge */}
        <div className="relative shrink-0">
          <svg width="70" height="45" viewBox="0 0 70 45">
            <path
              d={`M ${35 - radius} 38 A ${radius} ${radius} 0 0 1 ${35 + radius} 38`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d={`M ${35 - radius} 38 A ${radius} ${radius} 0 0 1 ${35 + radius} 38`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: `drop-shadow(0 0 4px ${color}40)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-end justify-center pb-0.5">
            <span className="text-lg font-bold text-text-primary tabular-nums">
              {Math.round(totalScore)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-accent-green" />
            <span className="text-sm font-semibold text-text-primary">{t('title')}</span>
          </div>

          {nextActions.length > 0 ? (
            <ul className="flex flex-col gap-0.5">
              {nextActions.slice(0, 2).map((action) => (
                <li key={action.item_key} className="text-xs text-text-muted truncate">
                  {action.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-accent-green">All items complete!</p>
          )}
        </div>

        <span className="text-xs font-medium text-accent-green shrink-0">
          {t('improveScore')} →
        </span>
      </Link>
    </Card>
  );
}
