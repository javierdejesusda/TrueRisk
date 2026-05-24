'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import type { Locale } from '@/i18n/routing';

/**
 * Keeps the Zustand store's `locale` in sync with the URL-driven next-intl
 * locale, so components that read `useAppStore((s) => s.locale)` see the
 * same value as the URL prefix.
 */
export function LocaleSync() {
  const locale = useLocale() as Locale;
  const setLocale = useAppStore((s) => s.setLocale);
  const storeLocale = useAppStore((s) => s.locale);

  useEffect(() => {
    if (storeLocale !== locale) {
      setLocale(locale);
    }
  }, [locale, storeLocale, setLocale]);

  return null;
}
