'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api-client';

interface CompletionData {
  total: number;
  sections: Record<string, number>;
}

const SECTION_KEYS = [
  'location',
  'residence',
  'health',
  'household',
  'emergency',
  'building',
  'economic',
] as const;

const LABEL_MAP: Record<string, string> = {
  location: 'sectionLocation',
  residence: 'sectionResidence',
  health: 'sectionHealth',
  household: 'sectionHousehold',
  emergency: 'sectionEmergency',
  building: 'sectionBuilding',
  economic: 'sectionEconomic',
};

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProfileCompletion() {
  const t = useTranslations('Profile');
  const [data, setData] = useState<CompletionData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch('/api/auth/me/completion')
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<CompletionData>;
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  if (!data) {
    return (
      <Card variant="glass">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-border rounded mb-4" />
          <div className="flex gap-6 items-center">
            <div className="w-24 h-24 rounded-full bg-border shrink-0" />
            <div className="flex-1 space-y-2">
              {SECTION_KEYS.map((k) => (
                <div key={k} className="h-3 bg-border rounded" />
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const pct = Math.min(100, Math.max(0, data.total));
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">
        {t('completionTitle')}
      </h2>
      <p className="font-[family-name:var(--font-sans)] text-xs text-text-muted mb-4">
        {t('completionDescription')}
      </p>

      <div className="flex gap-6 items-center">
        {/* Circular progress ring */}
        <div className="shrink-0 relative w-24 h-24">
          <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={RADIUS}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="8"
            />
            <circle
              cx="48"
              cy="48"
              r={RADIUS}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-[family-name:var(--font-display)] text-xl font-extrabold text-text-primary leading-none">
              {pct}%
            </span>
          </div>
        </div>

        {/* Section bars */}
        <div className="flex-1 space-y-1.5">
          {SECTION_KEYS.map((key) => {
            const val = data.sections[key] ?? 0;
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-[family-name:var(--font-sans)] text-xs text-text-muted">
                    {t(LABEL_MAP[key] as Parameters<typeof t>[0])}
                  </span>
                  <span className="font-[family-name:var(--font-sans)] text-xs text-text-secondary">
                    {val}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${val}%`,
                      backgroundColor: 'var(--color-accent)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
