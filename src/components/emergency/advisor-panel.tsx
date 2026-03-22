'use client';

import { useTranslations } from 'next-intl';
import { useEmergencyGuidance } from '@/hooks/use-emergency-advisor';

export function AdvisorPanel() {
  const t = useTranslations('Emergency');
  const { guidance } = useEmergencyGuidance();

  if (!guidance) {
    return (
      <div className="space-y-3">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary">
          {t('emergencyGuidance')}
        </h3>
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="font-[family-name:var(--font-sans)] text-xs text-accent-green">
            {t('noRiskGuidance')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-text-primary">
        {guidance.title}
      </h3>

      {/* Situation */}
      <div className="glass rounded-xl p-4 border-l-[3px] border-accent-yellow">
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed">
          {guidance.sections.situation}
        </p>
      </div>

      {/* Immediate Actions */}
      <div className="glass rounded-xl p-4 border-l-[3px] border-accent-red">
        <h4 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-wider text-accent-red mb-3">
          {t('immediateActions')}
        </h4>
        <ol className="space-y-2">
          {guidance.sections.immediateActions.map((action, i) => (
            <li key={i} className="flex gap-2 font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed">
              <span className="font-[family-name:var(--font-mono)] text-accent-red shrink-0">{i + 1}.</span>
              {action}
            </li>
          ))}
        </ol>
      </div>

      {/* Preparation */}
      <div className="glass rounded-xl p-4 border-l-[3px] border-accent-blue">
        <h4 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-wider text-accent-blue mb-3">
          {t('preparation')}
        </h4>
        <ol className="space-y-2">
          {guidance.sections.preparation.map((step, i) => (
            <li key={i} className="flex gap-2 font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed">
              <span className="font-[family-name:var(--font-mono)] text-accent-blue shrink-0">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Evacuation (if exists) */}
      {guidance.sections.evacuation && (
        <div className="glass rounded-xl p-4 border-l-[3px] border-accent-orange">
          <h4 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-wider text-accent-orange mb-3">
            {t('evacuation')}
          </h4>
          <ol className="space-y-2">
            {guidance.sections.evacuation.map((step, i) => (
              <li key={i} className="flex gap-2 font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed">
                <span className="font-[family-name:var(--font-mono)] text-accent-orange shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
