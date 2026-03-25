'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { StepWelcome } from './step-welcome';
import { StepLocation } from './step-location';
import { StepProfile } from './step-profile';
import { StepNotifications } from './step-notifications';

const TOTAL_STEPS = 4;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export function OnboardingFlow() {
  const t = useTranslations('Onboarding');
  const dismissOnboarding = useAppStore((s) => s.dismissOnboarding);
  const residenceType = useAppStore((s) => s.residenceType);
  const specialNeeds = useAppStore((s) => s.specialNeeds);
  const provinceCode = useAppStore((s) => s.provinceCode);
  const backendToken = useAppStore((s) => s.backendToken);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleFinish = useCallback(async () => {
    // Optionally save profile to backend
    if (backendToken && (residenceType || specialNeeds.length > 0)) {
      try {
        await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${backendToken}`,
          },
          body: JSON.stringify({
            province_code: provinceCode,
            residence_type: residenceType,
            special_needs: specialNeeds,
          }),
        });
      } catch {
        // Non-critical — silently continue
      }
    }
    dismissOnboarding();
  }, [backendToken, residenceType, specialNeeds, provinceCode, dismissOnboarding]);

  const handleSkip = useCallback(() => {
    dismissOnboarding();
  }, [dismissOnboarding]);

  const isFirst = step === 0;
  const isLast = step === TOTAL_STEPS - 1;

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepWelcome />;
      case 1:
        return <StepLocation />;
      case 2:
        return <StepProfile />;
      case 3:
        return <StepNotifications />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="glass-heavy relative w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl"
      >
        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={[
                'h-1.5 rounded-full transition-all duration-300',
                i === step
                  ? 'w-6 bg-accent-green'
                  : i < step
                    ? 'w-1.5 bg-accent-green/40'
                    : 'w-1.5 bg-white/10',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Step counter */}
        <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-muted text-center mb-4">
          {t('step', { current: step + 1, total: TOTAL_STEPS })}
        </p>

        {/* Animated step content */}
        <div className="relative min-h-[280px] flex items-start justify-center overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
          <div>
            {!isFirst ? (
              <button
                type="button"
                onClick={handleBack}
                className="cursor-pointer font-[family-name:var(--font-sans)] text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-1.5"
              >
                {t('back')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkip}
                className="cursor-pointer font-[family-name:var(--font-sans)] text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-1.5"
              >
                {t('skip')}
              </button>
            )}
          </div>

          <div>
            {isLast ? (
              <button
                type="button"
                onClick={handleFinish}
                className="cursor-pointer rounded-lg bg-accent-green px-5 py-2 font-[family-name:var(--font-sans)] text-sm font-medium text-[#050508] transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                {t('finish')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="cursor-pointer rounded-lg bg-accent-green/15 px-5 py-2 font-[family-name:var(--font-sans)] text-sm font-medium text-accent-green transition-colors hover:bg-accent-green/25"
              >
                {t('next')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
