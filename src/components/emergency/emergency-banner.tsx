'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { useEmergencyGuidance } from '@/hooks/use-emergency-advisor';

export function EmergencyBanner() {
  const tCommon = useTranslations('Common');
  const tEmergency = useTranslations('Emergency');
  const risk = useAppStore((s) => s.risk);
  const provinceCode = useAppStore((s) => s.provinceCode);
  const { guidance } = useEmergencyGuidance();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isHighRisk = risk && risk.composite_score >= 60;
  const isCritical = risk && risk.composite_score >= 80;

  useEffect(() => {
    setDismissed(false);
  }, [provinceCode]);

  if (!isHighRisk || dismissed) return null;

  const bgColor = isCritical ? 'bg-red-600/90' : 'bg-accent-orange/90';
  const borderColor = isCritical ? 'border-red-500/50' : 'border-accent-orange/50';

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-lg">
      <div className={`${bgColor} backdrop-blur-sm border ${borderColor} rounded-xl px-4 py-3 shadow-lg`}>
        <div className="flex items-start gap-3">
          <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold animate-pulse">
            !
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-[family-name:var(--font-display)] text-xs font-bold text-white uppercase tracking-wider">
              {isCritical ? 'RIESGO CRITICO' : 'RIESGO ALTO'} — {risk?.dominant_hazard}
            </p>
            {expanded && guidance ? (
              <p className="font-[family-name:var(--font-sans)] text-[11px] text-white/90 mt-2 leading-relaxed">
                {guidance.sections.situation}
              </p>
            ) : (
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-white/70 mt-1">
                Puntuacion: {risk?.composite_score?.toFixed(0)}/100
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="font-[family-name:var(--font-sans)] text-[10px] text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {tEmergency('emergencyGuidance')}
              </button>
            )}
            {expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="font-[family-name:var(--font-sans)] text-[10px] text-white/60 hover:text-white/80 px-2 py-1 cursor-pointer"
              >
                Minimizar
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="text-white/60 hover:text-white/90 p-1 cursor-pointer"
              aria-label={tCommon('close')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
