'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { LanguageSwitcher } from './language-switcher';

export function NavPill() {
  const pathname = usePathname();
  const alerts = useAppStore((s) => s.alerts);
  const risk = useAppStore((s) => s.risk);
  const t = useTranslations('Nav');

  const isHighRisk = risk && risk.composite_score >= 60;

  const navItems = [
    { href: '/map', label: t('map') },
    { href: '/prediction', label: t('predictions') },
    { href: '/alerts', label: t('alerts') },
    { href: '/emergency', label: t('sos') },
  ];

  const isActive = (href: string) => {
    if (href === '/map') return pathname === '/map';
    return pathname.startsWith(href);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 glass-heavy rounded-2xl h-12 px-5 max-w-md w-auto"
    >
      {/* Logo */}
      <span
        className="text-sm font-bold text-accent-green font-[family-name:var(--font-display)] tracking-tight select-none shrink-0"
        style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.2)' }}
      >
        TrueRisk
      </span>

      <div className="w-px h-5 bg-gradient-to-b from-transparent via-white/10 to-transparent shrink-0" />

      {/* Nav tabs */}
      <div className="flex gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200',
              item.href === '/emergency' && isHighRisk
                ? 'bg-red-500/20 text-red-400 animate-[glow-pulse_2s_infinite]'
                : isActive(item.href)
                  ? 'bg-accent-green/15 text-accent-green'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
            ].join(' ')}
            {...(item.href === '/emergency' && isHighRisk
              ? { style: { '--glow-color': 'rgba(239, 68, 68, 0.3)' } as React.CSSProperties }
              : {})}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Language switcher */}
      <LanguageSwitcher />

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
