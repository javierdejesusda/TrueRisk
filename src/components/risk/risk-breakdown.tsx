'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface RiskBreakdownProps {
  breakdown: Array<{
    name: string;
    score: number;
    weight: number;
    details: string;
  }>;
  isLoading: boolean;
}

function getBarColor(score: number): string {
  if (score < 30) return 'var(--color-accent-green)';
  if (score < 60) return 'var(--color-accent-yellow)';
  if (score < 80) return 'var(--color-accent-orange)';
  return 'var(--color-accent-red)';
}

function getBarBgClass(score: number): string {
  if (score < 30) return 'bg-accent-green/15';
  if (score < 60) return 'bg-accent-yellow/15';
  if (score < 80) return 'bg-accent-orange/15';
  return 'bg-accent-red/15';
}

function formatWeight(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

export function RiskBreakdown({ breakdown, isLoading }: RiskBreakdownProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card padding="md">
        <div className="flex flex-col gap-4">
          <Skeleton width="140px" height="16px" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Skeleton width="120px" height="14px" />
                <Skeleton width="32px" height="14px" />
              </div>
              <Skeleton width="100%" height="8px" rounded="full" />
              <Skeleton width="40px" height="12px" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="flex flex-col gap-5">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Risk Breakdown
        </h3>

        {breakdown.map((factor, index) => (
          <div
            key={factor.name}
            className="relative flex flex-col gap-1.5"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Label row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">
                  {factor.name}
                </span>
                <span className="text-xs text-text-muted">
                  Weight: {formatWeight(factor.weight)}
                </span>
              </div>
              <span className="text-sm font-bold text-text-primary tabular-nums">
                {Math.round(factor.score)}
              </span>
            </div>

            {/* Bar */}
            <div
              className={[
                'relative h-2 w-full overflow-hidden rounded-full',
                getBarBgClass(factor.score),
              ].join(' ')}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: getBarColor(factor.score) }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(factor.score, 100)}%` }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </div>

            {/* Tooltip on hover */}
            {hoveredIndex === index && factor.details && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs text-text-secondary shadow-lg"
                role="tooltip"
              >
                {factor.details}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
