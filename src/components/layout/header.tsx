'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';

interface Province {
  ine_code: string;
  name: string;
}

export interface HeaderProps {
  hasActiveAlerts?: boolean;
}

export function Header({ hasActiveAlerts = false }: HeaderProps) {
  const t = useTranslations('Backoffice');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    fetch('/api/provinces')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.provinces) setProvinces(data.provinces);
      })
      .catch(() => {});
  }, []);

  const selectedName = provinces.find((p) => p.ine_code === provinceCode)?.name ?? 'Loading...';

  return (
    <header className="flex h-14 items-center justify-between border-b border-border glass-heavy px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <div className="w-10 lg:w-0" />
        <span className="font-[family-name:var(--font-display)] text-sm font-bold text-text-primary hidden lg:inline">{t('adminPanel')}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {hasActiveAlerts && (
          <div className="flex items-center gap-2 text-sm text-accent-red font-[family-name:var(--font-sans)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-red" />
            </span>
            <span className="hidden sm:inline">{t('activeAlerts')}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
            <circle cx="10" cy="8" r="3" />
            <path d="M3 18c0-4 3.5-6 7-6s7 2 7 6" />
          </svg>
          <select
            value={provinceCode}
            onChange={(e) => setProvinceCode(e.target.value)}
            className="rounded-md border border-border bg-bg-primary px-2 py-1 text-sm text-text-primary font-[family-name:var(--font-sans)] focus:outline-none focus:ring-1 focus:ring-accent-primary focus:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
          >
            {provinces.length > 0 ? (
              provinces.map((p) => (
                <option key={p.ine_code} value={p.ine_code} className="bg-bg-secondary">{p.name}</option>
              ))
            ) : (
              <option value={provinceCode} className="bg-bg-secondary">{selectedName}</option>
            )}
          </select>
        </div>
      </div>
    </header>
  );
}
