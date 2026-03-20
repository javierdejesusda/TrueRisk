'use client';

import { useAppStore } from '@/store/app-store';

export function LanguageSwitcher() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  return (
    <button
      onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:bg-white/5 cursor-pointer"
      aria-label={`Switch to ${locale === 'es' ? 'English' : 'Spanish'}`}
    >
      <span className={locale === 'es' ? 'text-accent-green' : 'text-text-muted'}>ES</span>
      <span className="text-text-muted">/</span>
      <span className={locale === 'en' ? 'text-accent-green' : 'text-text-muted'}>EN</span>
    </button>
  );
}
