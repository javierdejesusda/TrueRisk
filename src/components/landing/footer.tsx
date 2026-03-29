'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const legalLinks = [
  { href: '/privacy', key: 'privacy' },
  { href: '/terms', key: 'terms' },
  { href: '/cookies', key: 'cookies' },
  { href: '/license', key: 'license' },
  { href: '/about', key: 'about' },
  { href: '/accessibility', key: 'accessibility' },
] as const;

export function Footer() {
  const tLanding = useTranslations('Landing');
  const tLegal = useTranslations('Legal.footer');

  return (
    <footer className="w-full border-t border-border bg-bg-primary px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        {/* Tech stack */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted">
          <span>{tLanding('builtWith')}</span>
          <span className="font-[family-name:var(--font-mono)] text-text-secondary">
            Next.js
          </span>
          <span className="text-border">|</span>
          <span className="font-[family-name:var(--font-mono)] text-text-secondary">
            FastAPI
          </span>
          <span className="text-border">|</span>
          <span className="font-[family-name:var(--font-mono)] text-text-secondary">
            MapLibre
          </span>
        </div>

        {/* Province coverage + GitHub */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-muted">
          <span>{tLanding('provincesCoverage')}</span>
          <a
            href="https://github.com/javierdejesusda/TrueRisk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-text-secondary transition-colors hover:text-text-primary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>

        {/* Legal links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted">
          {legalLinks.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              className="transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary"
            >
              {tLegal(key)}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-xs text-text-muted">
          {tLanding('copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
