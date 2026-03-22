'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AlertExplanation } from '@/hooks/use-alert-preferences';

interface AlertExplanationProps {
  alertId: number;
  onExplain: (alertId: number) => Promise<AlertExplanation | null>;
}

export function AlertExplanationToggle({ alertId, onExplain }: AlertExplanationProps) {
  const t = useTranslations('AlertIntelligence');
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<AlertExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (!explanation) {
      setLoading(true);
      const result = await onExplain(alertId);
      setExplanation(result);
      setLoading(false);
    }
    setIsOpen(true);
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
      >
        <HelpCircle className="w-3 h-3" />
        {t('whyThisAlert')}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="w-3 h-3" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="mt-2 p-2 text-xs text-text-muted">Loading...</div>
            ) : explanation ? (
              <div className="mt-2 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-xs text-text-primary mb-2">{explanation.reason}</p>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-text-muted uppercase">{t('relevance')}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-green transition-all"
                      style={{ width: `${explanation.relevance_score * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted tabular-nums">
                    {Math.round(explanation.relevance_score * 100)}%
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {explanation.factors.map((factor, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-text-secondary"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-2 p-2 text-xs text-text-muted">Could not load explanation</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
