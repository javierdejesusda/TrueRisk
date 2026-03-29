import Link from 'next/link';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export const metadata = {
  robots: 'index, follow',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
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
            <Link href="/privacy" className="transition-colors hover:text-text-primary">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-text-primary">Terms of Use</Link>
            <Link href="/cookies" className="transition-colors hover:text-text-primary">Cookie Policy</Link>
            <Link href="/license" className="transition-colors hover:text-text-primary">License</Link>
            <Link href="/about" className="transition-colors hover:text-text-primary">About</Link>
            <Link href="/accessibility" className="transition-colors hover:text-text-primary">Accessibility</Link>
          </nav>
          <p className="mt-4 text-center text-xs text-text-muted">
            © {new Date().getFullYear()} TrueRisk. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
