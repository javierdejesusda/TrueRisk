'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { get } from '@/lib/offline-storage';
import { useAppStore } from '@/store/app-store';

const EMERGENCY_CONTACTS = [
  { nameKey: 'emergency112' as const, number: '112' },
  { nameKey: 'guardiaCivil' as const, number: '062' },
  { nameKey: 'fireDept' as const, number: '080' },
  { nameKey: 'police' as const, number: '091' },
];

interface CachedRisk {
  composite?: number;
  dominant_hazard?: string;
}

export function OfflineEmergencyView() {
  const t = useTranslations('Offline');
  const tDisaster = useTranslations('DisasterTypes');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const [lastSyncLabel, setLastSyncLabel] = useState<string | null>(null);
  const [riskData, setRiskData] = useState<CachedRisk | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('offlinePack:lastSync');
    if (stored) {
      const diff = Date.now() - new Date(stored).getTime();
      const mins = Math.floor(diff / 60_000);
      let label: string;
      if (mins < 1) label = '< 1 min';
      else if (mins < 60) label = `${mins} min`;
      else {
        const hrs = Math.floor(mins / 60);
        label = `${hrs}h ${mins % 60}m`;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating client-only state on mount is intentional
      setLastSyncLabel(label);
    }

    (async () => {
      const cached = await get<CachedRisk>('riskScores', 'latest');
      if (cached) setRiskData(cached);
    })();
  }, [provinceCode]);

  return (
    <div className="flex flex-col gap-4 p-4 pb-28 overflow-y-auto max-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="glass-heavy rounded-2xl border border-accent-orange/30 p-4">
        <h1 className="text-lg font-semibold font-[family-name:var(--font-display)] text-accent-orange">
          {t('title')}
        </h1>
        {lastSyncLabel && (
          <p className="text-xs text-white/50 mt-1">
            {t('lastUpdated')}: {lastSyncLabel}
          </p>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="glass-heavy rounded-2xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold font-[family-name:var(--font-display)] text-white/90 mb-3">
          {t('emergencyContacts')}
        </h2>
        <div className="flex flex-col gap-2">
          {EMERGENCY_CONTACTS.map((contact) => (
            <a
              key={contact.number}
              href={`tel:${contact.number}`}
              className="flex items-center justify-between glass-heavy rounded-xl border border-white/10 p-3 hover:border-accent-orange/30 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-red-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="text-sm text-white/80">{t(contact.nameKey)}</span>
              </div>
              <span className="text-xl font-bold font-[family-name:var(--font-display)] text-white">
                {contact.number}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Last Known Risk Level */}
      {riskData && (
        <div className="glass-heavy rounded-2xl border border-white/10 p-4">
          <h2 className="text-sm font-semibold font-[family-name:var(--font-display)] text-white/90 mb-2">
            {t('riskLevel')}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold font-[family-name:var(--font-display)] text-accent-orange">
              {riskData.composite ?? '--'}
            </div>
            {riskData.dominant_hazard && (
              <span className="text-xs text-white/50 uppercase tracking-wider">
                {riskData.dominant_hazard}
              </span>
            )}
          </div>
        </div>
      )}

      {/* First Aid / Emergency Guidance */}
      <div className="glass-heavy rounded-2xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold font-[family-name:var(--font-display)] text-white/90 mb-3">
          {t('firstAid')}
        </h2>
        <div className="flex flex-col gap-2">
          {/* Flood Safety */}
          <div className="glass-heavy rounded-xl border border-blue-400/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 text-base">&#x1F4A7;</span>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                {tDisaster('flood')}
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">{t('floodSafety')}</p>
          </div>

          {/* Fire Safety */}
          <div className="glass-heavy rounded-xl border border-orange-400/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-orange-400 text-base">&#x1F525;</span>
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                {tDisaster('wildfire')}
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">{t('fireSafety')}</p>
          </div>

          {/* Earthquake Safety */}
          <div className="glass-heavy rounded-xl border border-amber-400/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 text-base">&#x1F30D;</span>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                {tDisaster('seismic')}
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">{t('earthquakeSafety')}</p>
          </div>

          {/* Heat Safety */}
          <div className="glass-heavy rounded-xl border border-red-400/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-400 text-base">&#x2600;&#xFE0F;</span>
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                {tDisaster('heatwave')}
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">{t('heatSafety')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
