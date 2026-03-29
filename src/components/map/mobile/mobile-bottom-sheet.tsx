'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { RiskPanel } from '@/components/map/panels/risk-panel';
import { WeatherPanel } from '@/components/map/panels/weather-panel';
import { AlertsPanel } from '@/components/map/panels/alerts-panel';

type SheetSnap = 'peek' | 'half' | 'full';
type ActiveTab = 'risk' | 'alerts' | 'weather';

const PEEK_HEIGHT = 100;

function getSnapY(snap: SheetSnap, viewportHeight: number): number {
  const sheetHeight = viewportHeight * 0.88;
  switch (snap) {
    case 'peek': return sheetHeight - PEEK_HEIGHT;
    case 'half': return sheetHeight * 0.4;
    case 'full': return 16;
  }
}

function riskColor(score: number): string {
  if (score >= 85) return 'text-accent-red';
  if (score >= 70) return 'text-accent-orange';
  if (score >= 50) return 'text-accent-yellow';
  return 'text-severity-1';
}

export function MobileBottomSheet() {
  const t = useTranslations('Map');
  const controls = useAnimation();
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [activeTab, setActiveTab] = useState<ActiveTab>('risk');
  const snapRef = useRef<SheetSnap>('peek');
  const dragRef = useRef({ startY: 0, startSheetY: 0 });
  const currentYRef = useRef(0);
  const vhRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 800);

  const risk = useAppStore((s) => s.risk);
  const weather = useAppStore((s) => s.weather);
  const alerts = useAppStore((s) => s.alerts);

  useEffect(() => {
    vhRef.current = window.innerHeight;
    const y = getSnapY('peek', vhRef.current);
    currentYRef.current = y;
    controls.set({ y });
  }, [controls]);

  useEffect(() => {
    const onResize = () => {
      vhRef.current = window.innerHeight;
      const y = getSnapY(snapRef.current, vhRef.current);
      currentYRef.current = y;
      controls.set({ y });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [controls]);

  const snapTo = useCallback((target: SheetSnap) => {
    const y = getSnapY(target, vhRef.current);
    setSnap(target);
    snapRef.current = target;
    currentYRef.current = y;
    controls.start({
      y,
      transition: { type: 'spring', damping: 32, stiffness: 350 },
    });
  }, [controls]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current = {
      startY: e.touches[0].clientY,
      startSheetY: currentYRef.current,
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - dragRef.current.startY;
    const maxY = getSnapY('peek', vhRef.current);
    const minY = getSnapY('full', vhRef.current);
    const newY = Math.max(minY, Math.min(maxY, dragRef.current.startSheetY + deltaY));
    currentYRef.current = newY;
    controls.set({ y: newY });
  }, [controls]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const delta = endY - dragRef.current.startY;
    const h = vhRef.current;
    const cur = currentYRef.current;

    if (delta < -60) {
      if (snapRef.current === 'peek') snapTo('half');
      else if (snapRef.current === 'half') snapTo('full');
      else snapTo('full');
      return;
    }
    if (delta > 60) {
      if (snapRef.current === 'full') snapTo('half');
      else if (snapRef.current === 'half') snapTo('peek');
      else snapTo('peek');
      return;
    }

    const snaps: SheetSnap[] = ['full', 'half', 'peek'];
    let closest: SheetSnap = 'peek';
    let minDist = Infinity;
    for (const s of snaps) {
      const d = Math.abs(cur - getSnapY(s, h));
      if (d < minDist) { minDist = d; closest = s; }
    }
    snapTo(closest);
  }, [snapTo]);

  const riskScore = risk?.composite_score ?? 0;
  const alertCount = alerts.length;
  const temp = weather?.temperature;

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'risk',
      label: t('risk'),
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      key: 'alerts',
      label: t('alerts'),
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      key: 'weather',
      label: t('panelWeather'),
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      ),
    },
  ];

  return (
    <motion.div
      animate={controls}
      initial={false}
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ height: '88vh' }}
    >
      <div className="h-full glass-heavy rounded-t-[20px] flex flex-col overflow-hidden shadow-[0_-4px_32px_rgba(0,0,0,0.6)]">
        {/* Drag handle + summary — touch target */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="shrink-0 touch-none select-none"
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-8 h-[3px] rounded-full bg-white/20" />
          </div>

          <button
            onClick={() => snapTo(snap === 'peek' ? 'half' : 'peek')}
            className="flex items-center justify-center gap-4 px-5 pb-3 w-full cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted shrink-0">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className={`font-[family-name:var(--font-mono)] text-sm font-bold ${riskColor(riskScore)}`}>
                {riskScore.toFixed(0)}
              </span>
            </div>

            <div className="w-px h-3.5 bg-white/10 shrink-0" />

            <div className="flex items-center gap-1.5">
              {alertCount > 0 ? (
                <>
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-red" />
                  </span>
                  <span className="text-[11px] text-text-secondary font-medium font-[family-name:var(--font-sans)]">
                    {alertCount} {t('active')}
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-severity-1 font-medium font-[family-name:var(--font-sans)]">
                  {t('allClear')}
                </span>
              )}
            </div>

            <div className="w-px h-3.5 bg-white/10 shrink-0" />

            <span className="font-[family-name:var(--font-mono)] text-sm font-bold text-text-primary">
              {temp != null ? `${temp.toFixed(0)}°` : '\u2014'}
            </span>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-3 pb-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (snap === 'peek') snapTo('half');
              }}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer font-[family-name:var(--font-sans)]',
                activeTab === tab.key
                  ? 'bg-white/[0.08] text-text-primary border border-white/[0.12]'
                  : 'text-text-muted bg-white/[0.02] border border-transparent',
              ].join(' ')}
            >
              <span className={activeTab === tab.key ? 'text-text-primary' : 'text-text-muted'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-10 mobile-sheet-panels">
          <div className={activeTab === 'risk' ? '' : 'hidden'}>
            <RiskPanel />
          </div>
          <div className={activeTab === 'alerts' ? '' : 'hidden'}>
            <AlertsPanel />
          </div>
          <div className={activeTab === 'weather' ? '' : 'hidden'}>
            <WeatherPanel />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
