import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export const metadata = {
  robots: 'index, follow',
};

const legalLinks = [
  { href: '/privacy', key: 'privacy' },
  { href: '/terms', key: 'terms' },
  { href: '/cookies', key: 'cookies' },
  { href: '/license', key: 'license' },
  { href: '/about', key: 'about' },
  { href: '/accessibility', key: 'accessibility' },
] as const;

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const tFooter = await getTranslations('Legal.footer');
  const tLanding = await getTranslations('Landing');

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg-primary/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-text-primary transition-opacity hover:opacity-80"
          >
            True<span className="text-accent-green">Risk</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Content */}
      {children}

      {/* Footer */}
      <footer className="border-t border-border bg-bg-primary px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-muted">
            {legalLinks.map(({ href, key }) => (
              <Link key={key} href={href} className="transition-colors hover:text-text-primary">
                {tFooter(key)}
              </Link>
            ))}
          </nav>
          <p className="mt-4 text-center text-xs text-text-muted">
            {tLanding('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
