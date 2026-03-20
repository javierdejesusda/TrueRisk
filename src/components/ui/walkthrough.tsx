'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

interface Step {
  selector: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="province-select"]',
    title: 'Select your province',
    description: 'Choose any of the 52 Spanish provinces to see personalized risk data.',
  },
  {
    selector: '[data-tour="risk-overview"]',
    title: 'Risk overview',
    description: 'Your composite risk score and per-hazard breakdown. Scores range from 0 (safe) to 100 (critical).',
  },
  {
    selector: '[data-tour="weather-card"]',
    title: 'Live weather',
    description: 'Current conditions from Open-Meteo, updated every 60 seconds.',
  },
  {
    selector: '[data-tour="alert-feed"]',
    title: 'Active alerts',
    description: 'Real-time AEMET weather alerts and community reports via SSE streaming.',
  },
];

export function Walkthrough() {
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const dismissOnboarding = useAppStore((s) => s.dismissOnboarding);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding]);

  const updateRect = useCallback(() => {
    const el = document.querySelector(STEPS[step]?.selector ?? '');
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [step]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  if (hasSeenOnboarding || !visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      dismissOnboarding();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    dismissOnboarding();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" onClick={handleSkip} />

        {/* Spotlight cutout */}
        {rect && (
          <div
            className="absolute rounded-lg ring-2 ring-accent-green/50 pointer-events-none"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute z-[101] w-72"
          style={{
            top: rect ? rect.bottom + 16 : '50%',
            left: rect ? Math.min(rect.left, window.innerWidth - 300) : '50%',
            transform: rect ? undefined : 'translate(-50%, -50%)',
          }}
        >
          <div className="glass-heavy rounded-xl border border-accent-green/30 bg-bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-accent-green">
                {step + 1}/{STEPS.length}
              </span>
              <button
                onClick={handleSkip}
                className="cursor-pointer font-[family-name:var(--font-sans)] text-[10px] text-text-muted hover:text-text-primary transition-colors"
              >
                Skip
              </button>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary mb-1">
              {current.title}
            </h3>
            <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-secondary leading-relaxed mb-3">
              {current.description}
            </p>
            <button
              onClick={handleNext}
              className="cursor-pointer w-full rounded-lg bg-accent-green/15 px-3 py-1.5 font-[family-name:var(--font-sans)] text-xs font-medium text-accent-green transition-colors hover:bg-accent-green/25"
            >
              {isLast ? 'Get started' : 'Next'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
