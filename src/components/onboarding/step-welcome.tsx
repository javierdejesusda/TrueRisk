'use client';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export function StepWelcome() {
  const t = useTranslations('Onboarding');

  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Logo / brand */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-accent-green/15 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7 text-accent-green"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-text-primary">
          {t('welcome')}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed max-w-sm">
          {t('welcomeDesc')}
        </p>
      </div>

      {/* Language toggle */}
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
        <span className="font-[family-name:var(--font-sans)] text-xs text-text-muted">Language:</span>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
