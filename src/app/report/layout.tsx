'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Auth');

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 border-b border-border bg-bg-secondary/80 backdrop-blur-lg">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary"
        >
          TrueRisk
        </Link>
        <Link
          href="/login"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {t('login')}
        </Link>
      </header>
      <main className="pt-16">{children}</main>
    </div>
  );
}
