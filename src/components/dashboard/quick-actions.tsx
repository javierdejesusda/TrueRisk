'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface QuickAction {
  titleKey: string;
  subtitleKey: string;
  href: string;
  icon: React.ReactNode;
}

const ACTIONS: QuickAction[] = [
  {
    titleKey: 'goToMap',
    subtitleKey: 'goToMapDesc',
    href: '/map',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    titleKey: 'goToPredictions',
    subtitleKey: 'goToPredictionsDesc',
    href: '/prediction',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    titleKey: 'goToAlerts',
    subtitleKey: 'goToAlertsDesc',
    href: '/alerts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    titleKey: 'goToEmergency',
    subtitleKey: 'goToEmergencyDesc',
    href: '/emergency',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    ),
  },
];

export function QuickActions() {
  const t = useTranslations('Dashboard');

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {ACTIONS.map(({ titleKey, subtitleKey, href, icon }) => (
        <Link
          key={href}
          href={href}
          className="group relative overflow-hidden rounded-2xl border border-border bg-bg-card p-4 transition-all duration-200 hover:border-accent-green/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.06)]"
        >
          <div className="flex flex-col gap-2">
            <span className="text-text-secondary group-hover:text-accent-green transition-colors duration-200">
              {icon}
            </span>
            <p className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary">
              {t(titleKey)}
            </p>
            <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-muted leading-relaxed">
              {t(subtitleKey)}
            </p>
          </div>
          {/* hover glow */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-accent-green/[0.03] to-transparent" />
        </Link>
      ))}
    </div>
  );
}
