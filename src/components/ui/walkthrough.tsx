'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { usePathname, useRouter } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TourStep {
  selector: string | null;
  titleKey: string;
  descKey: string;
  icon: string;
  placement?: 'bottom' | 'top' | 'left' | 'right';
}

/* ------------------------------------------------------------------ */
/*  Steps                                                              */
/* ------------------------------------------------------------------ */

const STEPS: TourStep[] = [
  {
    selector: null,
    titleKey: 'welcomeTitle',
    descKey: 'welcomeDesc',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  },
  {
    selector: '[data-tour="nav-pill"]',
    titleKey: 'navTitle',
    descKey: 'navDesc',
    icon: 'M3 12h18M3 6h18M3 18h18',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="province-select"]',
    titleKey: 'provinceTitle',
    descKey: 'provinceDesc',
    icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="risk-overview"]',
    titleKey: 'riskTitle',
    descKey: 'riskDesc',
    icon: 'M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.97L13.75 4a2 2 0 00-3.5 0L3.32 16.03A2 2 0 005.07 19z',
    placement: 'right',
  },
  {
    selector: '[data-tour="weather-card"]',
    titleKey: 'weatherTitle',
    descKey: 'weatherDesc',
    icon: 'M12 2v2m6.36.64l-1.41 1.41M21 12h-2M17.77 17.77l-1.41-1.41M12 18v2M6.64 17.77l1.41-1.41M4 12H2M6.64 6.64L5.22 5.22M12 6a6 6 0 100 12 6 6 0 000-12z',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="alert-feed"]',
    titleKey: 'alertsTitle',
    descKey: 'alertsDesc',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    placement: 'left',
  },
  {
    selector: '[data-tour="quick-actions"]',
    titleKey: 'quickActionsTitle',
    descKey: 'quickActionsDesc',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    placement: 'top',
  },
  {
    selector: '[data-tour="preparedness-widget"]',
    titleKey: 'preparednessTitle',
    descKey: 'preparednessDesc',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    placement: 'top',
  },
  {
    selector: null,
    titleKey: 'featuresTitle',
    descKey: 'featuresDesc',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  },
];

/* ------------------------------------------------------------------ */
/*  Feature cards                                                      */
/* ------------------------------------------------------------------ */

interface FeatureCard {
  titleKey: string;
  descKey: string;
  icon: string;
  color: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    titleKey: 'featureMap',
    descKey: 'featureMapDesc',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    color: 'from-blue-400/25 to-cyan-400/25',
  },
  {
    titleKey: 'featureEmergency',
    descKey: 'featureEmergencyDesc',
    icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    color: 'from-red-400/25 to-rose-400/25',
  },
  {
    titleKey: 'featurePredictions',
    descKey: 'featurePredictionsDesc',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    color: 'from-violet-400/25 to-purple-400/25',
  },
  {
    titleKey: 'featureEvacuation',
    descKey: 'featureEvacuationDesc',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    color: 'from-amber-400/25 to-orange-400/25',
  },
  {
    titleKey: 'featureSafety',
    descKey: 'featureSafetyDesc',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    color: 'from-emerald-400/25 to-green-400/25',
  },
  {
    titleKey: 'featureReport',
    descKey: 'featureReportDesc',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'from-teal-400/25 to-cyan-400/25',
  },
];

/* ------------------------------------------------------------------ */
/*  Positioning helper                                                 */
/* ------------------------------------------------------------------ */

function getTooltipPosition(
  rect: DOMRect,
  placement: TourStep['placement'],
  tooltipW: number,
  tooltipH: number,
) {
  const pad = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'top':
      top = rect.top - tooltipH - pad;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - pad;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + pad;
      break;
    case 'bottom':
    default:
      top = rect.bottom + pad;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
  }

  // Clamp inside viewport
  if (left < 12) left = 12;
  if (left + tooltipW > vw - 12) left = vw - tooltipW - 12;
  if (top < 12) top = 12;
  if (top + tooltipH > vh - 12) top = vh - tooltipH - 12;

  return { top, left };
}

/* ------------------------------------------------------------------ */
/*  Hook: elevate a DOM element above the overlay                      */
/* ------------------------------------------------------------------ */

function useElevateElement(selector: string | null, active: boolean) {
  const prevElRef = useRef<HTMLElement | null>(null);
  const prevStylesRef = useRef<{ position: string; zIndex: string; pointerEvents: string } | null>(
    null,
  );

  const cleanup = useCallback(() => {
    if (prevElRef.current && prevStylesRef.current) {
      prevElRef.current.style.position = prevStylesRef.current.position;
      prevElRef.current.style.zIndex = prevStylesRef.current.zIndex;
      prevElRef.current.style.pointerEvents = prevStylesRef.current.pointerEvents;
    }
    prevElRef.current = null;
    prevStylesRef.current = null;
  }, []);

  useEffect(() => {
    // Clean up previous element first
    cleanup();

    if (!active || !selector) return;

    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;

    // Save original styles
    prevStylesRef.current = {
      position: el.style.position,
      zIndex: el.style.zIndex,
      pointerEvents: el.style.pointerEvents,
    };
    prevElRef.current = el;

    // Elevate above overlay (z-[9999])
    el.style.position = 'relative';
    el.style.zIndex = '10001';
    el.style.pointerEvents = 'none';

    return cleanup;
  }, [selector, active, cleanup]);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Walkthrough() {
  const t = useTranslations('Walkthrough');
  const hasSeenWalkthrough = useAppStore((s) => s.hasSeenWalkthrough);
  const dismissWalkthrough = useAppStore((s) => s.dismissWalkthrough);
  const pathname = usePathname();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipSize, setTooltipSize] = useState({ w: 340, h: 200 });

  const current = STEPS[step];
  const isFullScreen = !current?.selector;

  // Elevate the targeted DOM element above the overlay so it's actually visible
  useElevateElement(current?.selector ?? null, visible && !hasSeenWalkthrough);

  // Redirect to dashboard if walkthrough needs dashboard elements
  useEffect(() => {
    if (!hasSeenWalkthrough && visible && pathname !== '/dashboard' && step >= 2 && step <= 7) {
      router.push('/dashboard');
    }
  }, [hasSeenWalkthrough, visible, pathname, step, router]);

  // Show after a short delay to let the page render
  useEffect(() => {
    if (!hasSeenWalkthrough) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenWalkthrough]);

  // Clear rect for full-screen steps (no selector)
  const selector = STEPS[step]?.selector ?? null;
  if (!selector && rect !== null) {
    setRect(null);
  }

  // Scroll into view, measure, and keep measured on resize/scroll
  useEffect(() => {
    if (!selector) return;

    function measure() {
      const el = document.querySelector(selector!);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    }

    const el = document.querySelector(selector);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Wait for scroll to settle then measure
    const timer = setTimeout(measure, 350);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, selector]);

  // Measure tooltip size for positioning
  useEffect(() => {
    if (tooltipRef.current) {
      const { offsetWidth, offsetHeight } = tooltipRef.current;
      setTooltipSize({ w: offsetWidth, h: offsetHeight });
    }
  }, [step]);

  if (hasSeenWalkthrough || !visible) return null;

  const isLast = step === STEPS.length - 1;
  const isFeatureStep = current.titleKey === 'featuresTitle';
  const progress = ((step + 1) / STEPS.length) * 100;

  const tooltipPos =
    rect && current.placement
      ? getTooltipPosition(rect, current.placement, tooltipSize.w, tooltipSize.h)
      : null;

  const handleNext = () => {
    if (isLast) {
      dismissWalkthrough();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSkip = () => {
    dismissWalkthrough();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Dark overlay — NO backdrop-blur so highlighted elements stay crisp */}
        <div className="absolute inset-0 bg-black/75" onClick={handleSkip} />

        {/* Spotlight cutout for targeted steps */}
        {rect && !isFullScreen && (
          <>
            {/* The cutout hole — punches through the dark overlay */}
            <motion.div
              key={`spotlight-${step}`}
              className="absolute rounded-xl pointer-events-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
              }}
            />

            {/* Green ring border */}
            <motion.div
              key={`ring-${step}`}
              className="absolute rounded-xl pointer-events-none ring-2 ring-accent-green/70"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16,
              }}
            />

            {/* Pulsing glow ring */}
            <motion.div
              key={`pulse-${step}`}
              className="absolute rounded-xl pointer-events-none"
              style={{
                top: rect.top - 12,
                left: rect.left - 12,
                width: rect.width + 24,
                height: rect.height + 24,
                border: '2px solid rgba(34,197,94,0.25)',
              }}
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.5, 0.15, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Animated pointer arrow from tooltip to element */}
            <motion.div
              key={`arrow-${step}`}
              className="absolute pointer-events-none z-[10002]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              style={{
                top:
                  current.placement === 'bottom'
                    ? rect.bottom + 4
                    : current.placement === 'top'
                      ? rect.top - 12
                      : rect.top + rect.height / 2 - 4,
                left:
                  current.placement === 'left'
                    ? rect.left - 12
                    : current.placement === 'right'
                      ? rect.right + 4
                      : rect.left + rect.width / 2 - 4,
              }}
            >
              <motion.div
                animate={{
                  y:
                    current.placement === 'bottom'
                      ? [0, 4, 0]
                      : current.placement === 'top'
                        ? [0, -4, 0]
                        : 0,
                  x:
                    current.placement === 'left'
                      ? [0, -4, 0]
                      : current.placement === 'right'
                        ? [0, 4, 0]
                        : 0,
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="4" fill="rgb(34,197,94)" />
                </svg>
              </motion.div>
            </motion.div>
          </>
        )}

        {/* ============================================================ */}
        {/*  FULL-SCREEN CARD (welcome + features)                        */}
        {/* ============================================================ */}
        {isFullScreen && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <motion.div
              key={`fullscreen-${step}`}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg"
            >
              <div className="glass-heavy rounded-2xl border border-white/[0.08] p-8 shadow-2xl overflow-hidden">
                {/* Decorative gradient orbs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-green/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-accent-blue/8 rounded-full blur-3xl pointer-events-none" />

                {/* Icon */}
                <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-green/10 border border-accent-green/20 mb-6">
                  <svg
                    className="w-7 h-7 text-accent-green"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={current.icon} />
                  </svg>
                </div>

                {/* Title */}
                <h2 className="relative font-[family-name:var(--font-display)] text-2xl font-extrabold text-text-primary mb-2 tracking-tight">
                  {t(current.titleKey)}
                </h2>
                <p className="relative font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed mb-6">
                  {t(current.descKey)}
                </p>

                {/* Feature cards grid */}
                {isFeatureStep && (
                  <div className="relative grid grid-cols-2 gap-2.5 mb-6">
                    {FEATURE_CARDS.map((card, i) => (
                      <motion.div
                        key={card.titleKey}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.1 + i * 0.06,
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`group cursor-default rounded-xl bg-gradient-to-br ${card.color} border border-white/[0.1] p-3 transition-all duration-200 hover:border-white/[0.2] hover:scale-[1.02]`}
                      >
                        <svg
                          className="w-4 h-4 text-white/70 mb-1.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d={card.icon} />
                        </svg>
                        <p className="font-[family-name:var(--font-display)] text-[11px] font-bold text-white leading-tight">
                          {t(card.titleKey)}
                        </p>
                        <p className="font-[family-name:var(--font-sans)] text-[10px] text-white/75 leading-snug mt-0.5">
                          {t(card.descKey)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                <div className="relative w-full h-1 rounded-full bg-white/[0.06] mb-4 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent-green/80 to-accent-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>

                {/* Controls */}
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                      {step + 1} / {STEPS.length}
                    </span>
                    <button
                      onClick={handleSkip}
                      className="cursor-pointer font-[family-name:var(--font-sans)] text-[11px] text-text-muted hover:text-text-primary transition-colors duration-200"
                    >
                      {t('skip')}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {step > 0 && (
                      <button
                        onClick={handleBack}
                        className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 font-[family-name:var(--font-sans)] text-xs font-medium text-text-secondary transition-all duration-200 hover:bg-white/[0.08] hover:text-text-primary"
                      >
                        {t('back')}
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className="cursor-pointer rounded-lg bg-accent-green/15 px-5 py-2 font-[family-name:var(--font-sans)] text-xs font-semibold text-accent-green transition-all duration-200 hover:bg-accent-green/25 active:scale-[0.97]"
                    >
                      {isLast ? t('finish') : t('next')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  TOOLTIP CARD (positioned next to highlighted element)         */}
        {/* ============================================================ */}
        {!isFullScreen && (
          <motion.div
            ref={tooltipRef}
            key={`tooltip-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-[10002] w-[340px]"
            style={{
              top: tooltipPos?.top ?? '50%',
              left: tooltipPos?.left ?? '50%',
              transform: tooltipPos ? undefined : 'translate(-50%, -50%)',
            }}
          >
            <div className="glass-heavy rounded-2xl border border-white/[0.08] p-5 shadow-2xl overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent-green/8 rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="relative flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 shrink-0">
                    <svg
                      className="w-[18px] h-[18px] text-accent-green"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={current.icon} />
                    </svg>
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary leading-tight">
                    {t(current.titleKey)}
                  </h3>
                </div>
                <button
                  onClick={handleSkip}
                  className="cursor-pointer font-[family-name:var(--font-sans)] text-[10px] text-text-muted hover:text-text-primary transition-colors duration-200 shrink-0 mt-1"
                >
                  {t('skip')}
                </button>
              </div>

              {/* Description */}
              <p className="relative font-[family-name:var(--font-sans)] text-[12px] text-text-secondary leading-relaxed mb-4">
                {t(current.descKey)}
              </p>

              {/* Progress bar */}
              <div className="relative w-full h-0.5 rounded-full bg-white/[0.06] mb-3 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent-green/80 to-accent-green"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              {/* Controls */}
              <div className="relative flex items-center justify-between">
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                  {step + 1} / {STEPS.length}
                </span>
                <div className="flex gap-2">
                  {step > 0 && (
                    <button
                      onClick={handleBack}
                      className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 font-[family-name:var(--font-sans)] text-[11px] font-medium text-text-secondary transition-all duration-200 hover:bg-white/[0.08] hover:text-text-primary"
                    >
                      {t('back')}
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="cursor-pointer rounded-lg bg-accent-green/15 px-4 py-1.5 font-[family-name:var(--font-sans)] text-[11px] font-semibold text-accent-green transition-all duration-200 hover:bg-accent-green/25 active:scale-[0.97]"
                  >
                    {isLast ? t('finish') : t('next')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
