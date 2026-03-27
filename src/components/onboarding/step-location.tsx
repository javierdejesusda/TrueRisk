'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { PROVINCES } from '@/lib/constants/provinces';
import { Select } from '@/components/ui/select';

export function StepLocation() {
  const t = useTranslations('Onboarding');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);
  const backendToken = useAppStore((s) => s.backendToken);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const provinceOptions = Object.entries(PROVINCES)
    .map(([code, info]) => ({ value: code, label: info.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleGeolocate = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      if (backendToken) {
        const res = await fetch('/api/v1/location/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${backendToken}`,
          },
          body: JSON.stringify({ lat: latitude, lon: longitude }),
        });

        if (res.ok) {
          const data = (await res.json()) as { province_code: string };
          setProvinceCode(data.province_code);
        }
      }
    } catch {
      setGeoError('Unable to get location');
    } finally {
      setGeoLoading(false);
    }
  }, [backendToken, setProvinceCode]);

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary mb-1">
          {t('locationTitle')}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed">
          {t('locationDesc')}
        </p>
      </div>

      <Select
        options={provinceOptions}
        value={provinceCode}
        onChange={(e) => setProvinceCode(e.target.value)}
        placeholder="—"
      />

      <button
        type="button"
        onClick={handleGeolocate}
        disabled={geoLoading}
        className="cursor-pointer flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 font-[family-name:var(--font-sans)] text-sm text-text-secondary transition-colors hover:border-accent-green/40 hover:text-accent-green disabled:opacity-50"
      >
        {geoLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
        )}
        {t('useMyLocation')}
      </button>

      {geoError && (
        <p className="font-[family-name:var(--font-sans)] text-xs text-accent-red text-center">{geoError}</p>
      )}
    </div>
  );
}
