'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useDanaNowcast } from '@/hooks/use-dana-nowcast';
import { useRiskScore } from '@/hooks/use-risk-score';

function NowcastBar({ label, score }: { label: string; score: number }) {
  const barColor =
    score >= 80
      ? 'bg-red-500'
      : score >= 60
        ? 'bg-orange-500'
        : score >= 40
          ? 'bg-amber-400'
          : 'bg-emerald-500';

  return (
    <div className="flex items-center gap-2">
      <span className="font-[family-name:var(--font-sans)] text-xs text-white/80 w-16 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(score, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="font-[family-name:var(--font-mono)] text-xs text-white/90 w-8 text-right tabular-nums">
        {Math.round(score)}
      </span>
    </div>
  );
}

export function DanaWarningBanner() {
  const t = useTranslations('Dana');
  const { risk } = useRiskScore();
  const { data: nowcast } = useDanaNowcast();

  const danaScore = risk?.dana_score ?? 0;
  const show = danaScore >= 60;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl p-4 sm:p-5"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #d97706 100%)',
            }}
          >
            <div className="flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                {/* Warning triangle icon */}
                <div className="shrink-0">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="12"
                      y1="9"
                      x2="12"
                      y2="13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12"
                      y1="17"
                      x2="12.01"
                      y2="17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-extrabold text-white uppercase tracking-wider">
                      {t('warning')}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                      {Math.round(danaScore)}/100
                    </span>
                  </div>
                  <p className="font-[family-name:var(--font-sans)] text-sm text-white/90 mt-0.5">
                    {t('description')}
                  </p>
                </div>
              </div>

              {/* Nowcast section */}
              {nowcast && (
                <div className="rounded-lg bg-black/15 p-3">
                  <h4 className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 mb-2">
                    {t('nowcast')}
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    <NowcastBar label={t('in1h')} score={nowcast.nowcast.t1h} />
                    <NowcastBar label={t('in3h')} score={nowcast.nowcast.t3h} />
                    <NowcastBar label={t('in6h')} score={nowcast.nowcast.t6h} />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {t('seekShelter')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
