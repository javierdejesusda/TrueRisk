'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

/* SVG icon helpers */

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L2 17h16L10 2z" />
      <path d="M10 8v4" />
      <circle cx="10" cy="14" r="0.5" fill="currentColor" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.3 2.7-5 6-5s6 1.7 6 5" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6l5-3 4 3 5-3v11l-5 3-4-3-5 3V6z" />
      <path d="M8 3v11" />
      <path d="M12 6v11" />
    </svg>
  );
}

function PredictionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,14 7,10 11,12 15,4" />
      <path d="M13 4h4v4" />
    </svg>
  );
}

function RecordsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12v14H4z" />
      <path d="M7 8h6M7 11h4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/* Sidebar component */

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('Nav');

  const navLinks: NavItem[] = [
    { label: t('dashboard'), href: '/dashboard', icon: <DashboardIcon /> },
    { label: t('map'), href: '/map', icon: <MapIcon /> },
    { label: t('predictions'), href: '/prediction', icon: <PredictionIcon /> },
    { label: t('alerts'), href: '/alerts', icon: <AlertIcon /> },
    { label: t('settings'), href: '/profile', icon: <ProfileIcon /> },
    { label: t('admin'), href: '/backoffice', icon: <RecordsIcon /> },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  const navContent = (
    <>
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 1C5 1 1 5 1 10s4 9 9 9 9-4 9-9S15 1 10 1zm0 16c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z" />
            <path d="M10 5l-1.5 4H5l3.5 2.5L7 16l3-2.2 3 2.2-1.5-4.5L15 9h-3.5z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-accent-green tracking-tight font-[family-name:var(--font-display)]" style={{ textShadow: '0 0 10px rgba(255,255,255,0.15)' }}>
          TrueRisk
        </span>
      </div>

      {/* Language switcher */}
      <div className="px-4 mb-1">
        <LanguageSwitcher />
      </div>

      {/* Nav links */}
      <nav aria-label="Main navigation" className="mt-2 flex flex-col gap-1 px-3">
        {navLinks.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 font-[family-name:var(--font-sans)]',
                active
                  ? 'bg-accent-green/10 text-accent-green'
                  : 'text-text-secondary hover:text-white',
              ].join(' ')}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="fixed top-3 left-3 z-50 rounded-lg bg-bg-secondary p-2 text-text-primary lg:hidden cursor-pointer"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      >
        {mobileOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed top-0 left-0 z-40 flex h-full w-60 flex-col border-r border-border bg-bg-secondary',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {navContent}
      </aside>
    </>
  );
}
