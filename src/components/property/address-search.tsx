'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCreateReport } from '@/hooks/use-property-report';

const steps = ['step1', 'step2', 'step3'] as const;

export function AddressSearch() {
  const t = useTranslations('PropertyReport');
  const router = useRouter();
  const { createReport, isCreating, error: hookError } = useCreateReport();
  const [address, setAddress] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!address.trim() || isCreating) return;

    setError(null);
    setCurrentStep(0);

    // Simulate step progression while the API call is in progress
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);

    try {
      const reportId = await createReport(address.trim());
      clearInterval(stepInterval);
      router.push(`/report/${reportId}`);
    } catch (err) {
      clearInterval(stepInterval);
      if (err instanceof Error) {
        if (err.message.includes('422')) {
          setError(t('errorNotFound'));
        } else if (err.message.includes('429')) {
          setError(t('errorRateLimit'));
        } else if (err.message.includes('504')) {
          setError(t('errorTimeout'));
        } else if (err.message.includes('502')) {
          setError(t('errorServiceUnavailable'));
        } else {
          setError(t('errorServer'));
        }
      } else {
        setError(t('errorServer'));
      }
    }
  };

  const displayError = error || (hookError ? t('errorServer') : null);

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t('inputPlaceholder')}
          disabled={isCreating}
          className="flex-1 h-13 sm:h-14 px-5 rounded-xl border border-border bg-bg-card text-text-primary placeholder:text-text-muted text-base font-[family-name:var(--font-sans)] outline-none focus:ring-2 focus:ring-severity-2/40 focus:border-severity-2/60 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!address.trim() || isCreating}
          className="h-13 sm:h-14 px-8 rounded-xl bg-severity-2 text-bg-primary font-[family-name:var(--font-display)] font-semibold text-sm sm:text-base whitespace-nowrap hover:bg-severity-2/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? t('analyzing') : t('analyzeButton')}
        </button>
      </form>

      {/* Step progress */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            className="mt-6 rounded-xl border border-border bg-bg-card p-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="space-y-3">
              {steps.map((step, i) => {
                const isActive = i === currentStep;
                const isComplete = i < currentStep;
                return (
                  <div key={step} className="flex items-center gap-3">
                    {/* Step indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold transition-colors ${
                        isComplete
                          ? 'bg-severity-1 text-bg-primary'
                          : isActive
                            ? 'bg-severity-2 text-bg-primary'
                            : 'bg-bg-secondary text-text-muted'
                      }`}
                    >
                      {isComplete ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    {/* Step label */}
                    <span
                      className={`text-sm font-[family-name:var(--font-sans)] transition-colors ${
                        isActive
                          ? 'text-text-primary'
                          : isComplete
                            ? 'text-severity-1'
                            : 'text-text-muted'
                      }`}
                    >
                      {t(step)}
                    </span>
                    {/* Spinner for active step */}
                    {isActive && (
                      <motion.div
                        className="w-4 h-4 border-2 border-severity-2 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {displayError && !isCreating && (
          <motion.p
            className="mt-4 text-sm text-severity-4 font-[family-name:var(--font-sans)] text-center"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {displayError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
