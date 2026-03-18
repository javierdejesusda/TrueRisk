'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

interface Province {
  ine_code: string;
  name: string;
}

export function NavPill() {
  const pathname = usePathname();
  const provinceCode = useAppStore((s) => s.provinceCode);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);
  const alerts = useAppStore((s) => s.alerts);
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    fetch('/api/provinces')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.provinces) setProvinces(data.provinces);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { href: '/', label: 'Map' },
    { href: '/prediction', label: 'Predictions' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/map';
    return pathname.startsWith(href);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 glass-heavy rounded-2xl h-11 px-4 max-w-md w-auto"
    >
      {/* Logo */}
      <span className="text-sm font-bold text-accent-green tracking-tight select-none shrink-0">
        TrueRisk
      </span>

      <div className="w-px h-5 bg-white/10 shrink-0" />

      {/* Nav tabs */}
      <div className="flex gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
              isActive(item.href)
                ? 'bg-white/10 text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
            ].join(' ')}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="w-px h-5 bg-white/10 shrink-0 hidden sm:block" />

      {/* Province selector */}
      <select
        value={provinceCode}
        onChange={(e) => setProvinceCode(e.target.value)}
        className="hidden sm:block bg-transparent text-xs text-text-secondary border-none outline-none cursor-pointer max-w-[120px] truncate"
      >
        {provinces.length > 0 ? (
          provinces.map((p) => (
            <option key={p.ine_code} value={p.ine_code} className="bg-bg-secondary text-text-primary">
              {p.name}
            </option>
          ))
        ) : (
          <option value={provinceCode} className="bg-bg-secondary">Loading...</option>
        )}
      </select>

      {/* Alert indicator */}
      {alerts.length > 0 && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-red" />
        </span>
      )}
    </motion.nav>
  );
}
