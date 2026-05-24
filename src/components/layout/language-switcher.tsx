'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAppStore } from '@/store/app-store';
import type { Locale } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const setLocale = useAppStore((s) => s.setLocale);
  const router = useRouter();
  const pathname = usePathname();
  const otherLocale: Locale = locale === 'es' ? 'en' : 'es';

  const handleSwitch = () => {
    setLocale(otherLocale);
    router.replace(pathname, { locale: otherLocale });
  };

  return (
    <button
      onClick={handleSwitch}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:bg-white/5 cursor-pointer"
      aria-label={`Switch to ${locale === 'es' ? 'English' : 'Spanish'}`}
    >
      <span className={locale === 'es' ? 'text-accent-green' : 'text-text-muted'}>ES</span>
      <span className="text-text-muted">/</span>
      <span className={locale === 'en' ? 'text-accent-green' : 'text-text-muted'}>EN</span>
    </button>
  );
}
