'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/hooks/use-auth';
import { LanguageSwitcher } from './language-switcher';

export function NavPill() {
  const pathname = usePathname();
  const alerts = useAppStore((s) => s.alerts);
  const risk = useAppStore((s) => s.risk);
  const clearAuth = useAppStore((s) => s.clearAuth);
  const t = useTranslations('Nav');
  const tAuth = useTranslations('Auth');
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHighRisk = risk && risk.composite_score >= 60;

  const navItems = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/map', label: t('map') },
    { href: '/report', label: t('report') },
    { href: '/preparedness', label: t('preparedness') },
    { href: '/safety', label: t('safety') },
    { href: '/evacuation', label: t('evacuation') },
    { href: '/prediction', label: t('predictions') },
    { href: '/alerts', label: t('alerts') },
    { href: '/emergency', label: t('sos') },
  ];

  const isActive = (href: string) => {
    if (href === '/map') return pathname === '/map';
    return pathname.startsWith(href);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  function handleSignOut() {
    clearAuth();
    signOut({ callbackUrl: '/login' });
    setDropdownOpen(false);
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 glass-heavy rounded-2xl h-12 px-5 max-w-3xl w-auto"
    >
      {/* Logo */}
      <Link
        href="/"
        className="text-sm font-bold text-accent-green font-[family-name:var(--font-display)] tracking-tight select-none shrink-0 hover:opacity-80 transition-opacity"
        style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.2)' }}
      >
        TrueRisk
      </Link>

      <div className="w-px h-5 bg-gradient-to-b from-transparent via-white/10 to-transparent shrink-0" />

      {/* Nav tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide whitespace-nowrap">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200',
              item.href === '/safety' && isHighRisk
                ? 'bg-pink-500/20 text-pink-400 animate-[glow-pulse_2s_infinite]'
                : item.href === '/emergency' && isHighRisk
                ? 'bg-red-500/20 text-red-400 animate-[glow-pulse_2s_infinite]'
                : isActive(item.href)
                  ? 'bg-accent-green/15 text-accent-green'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
            ].join(' ')}
            {...(item.href === '/safety' && isHighRisk
              ? { style: { '--glow-color': 'rgba(236, 72, 153, 0.3)' } as React.CSSProperties }
              : item.href === '/emergency' && isHighRisk
              ? { style: { '--glow-color': 'rgba(239, 68, 68, 0.3)' } as React.CSSProperties }
              : {})}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Language switcher */}
      <LanguageSwitcher />

      {/* User avatar with dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={[
            'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 cursor-pointer overflow-hidden',
            isActive('/profile')
              ? 'ring-2 ring-accent-green'
              : 'ring-1 ring-white/10 hover:ring-white/30',
          ].join(' ')}
        >
          {user?.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.image}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full bg-accent-green/20 text-accent-green text-xs font-bold font-[family-name:var(--font-display)]">
              {userInitial}
            </span>
          )}
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-44 glass-heavy rounded-xl py-1.5 shadow-lg"
            >
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {t('settings')}
              </Link>
              <div className="mx-3 my-1 border-t border-white/5" />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-accent-red hover:bg-white/5 transition-colors cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {tAuth('logoutButton')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alert indicator */}
      {alerts.length > 0 && (
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-red" />
        </span>
      )}
    </motion.nav>
  );
}
