'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Section {
  id: string;
  label: string;
}

interface LegalPageShellProps {
  titleKey: string;
  lastUpdated: string;
  sections: Section[];
  children: React.ReactNode;
}

export function LegalPageShell({ titleKey, lastUpdated, sections, children }: LegalPageShellProps) {
  const t = useTranslations('Legal');

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>

        {/* Title */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          {titleKey}
        </h1>

        {/* Last updated */}
        <p className="mt-2 text-sm text-text-muted">
          {t('lastUpdated', { date: lastUpdated })}
        </p>

        <div className="mt-10 flex gap-12">
          {/* Table of Contents — desktop sidebar */}
          {sections.length > 0 && (
            <aside className="hidden lg:block w-56 shrink-0">
              <nav className="sticky top-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t('tableOfContents')}
                </p>
                <ul className="space-y-2 border-l border-border pl-4">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block text-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary"
                      >
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          {/* Content */}
          <article className="min-w-0 flex-1 prose-legal">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
