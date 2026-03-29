'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ModelCard } from './model-card';
import type { PredictionResponse } from './shared';

interface Props {
  data: PredictionResponse['knn'];
}

function KnnMatchesInner({ data }: Props) {
  const t = useTranslations('StatisticalModels');

  return (
    <ModelCard
      title={t('knn')}
      subtitle={t('knnSubtitle')}
      methodology={t('knnMethod')}
      className="md:col-span-2 lg:col-span-2"
      index={6}
    >
      <div className="space-y-2.5">
        {data.map((event, i) => {
          const similarity = Math.max(0, (1 - event.distance) * 100);
          const isTopMatch = i === 0;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className={[
                'flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-white/[0.05]',
                isTopMatch
                  ? 'bg-white/[0.05] ring-1 ring-accent-yellow/20 shadow-[0_0_12px_rgba(250,204,21,0.04)]'
                  : 'bg-white/[0.03]',
              ].join(' ')}
            >
              {/* Year badge — prominent on the left */}
              <div className={[
                'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg',
                isTopMatch ? 'bg-accent-yellow/15' : 'bg-bg-secondary',
              ].join(' ')}>
                <span className={[
                  'font-[family-name:var(--font-mono)] text-base font-bold',
                  isTopMatch ? 'text-accent-yellow' : 'text-text-secondary',
                ].join(' ')}>
                  {event.year}
                </span>
                {isTopMatch && (
                  <span className="text-[8px] uppercase tracking-wider text-accent-yellow/70 font-[family-name:var(--font-sans)]">{t('topMatch')}</span>
                )}
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <p className="font-[family-name:var(--font-sans)] text-sm font-medium text-text-primary truncate">{event.event}</p>
                <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">{event.outcome}</p>

                {/* Similarity bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${similarity}%` }}
                      transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                      style={{
                        backgroundColor: similarity >= 80 ? '#22c55e' : similarity >= 50 ? '#eab308' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] tabular-nums text-text-muted w-10 text-right">
                    {similarity.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Distance value */}
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-[family-name:var(--font-sans)]">{t('distance')}</span>
                <span className="font-[family-name:var(--font-mono)] text-xs font-medium tabular-nums text-text-secondary">
                  {event.distance.toFixed(3)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </ModelCard>
  );
}

export const KnnMatches = memo(KnnMatchesInner);
