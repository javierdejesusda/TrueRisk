'use client';

import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';

const RESIDENCE_TYPES = ['apartment', 'house', 'rural', 'other'] as const;

const SPECIAL_NEEDS = ['elderly', 'children', 'pets', 'disability', 'medical'] as const;

export function StepProfile() {
  const t = useTranslations('Onboarding');
  const residenceType = useAppStore((s) => s.residenceType);
  const setResidenceType = useAppStore((s) => s.setResidenceType);
  const specialNeeds = useAppStore((s) => s.specialNeeds);
  const setSpecialNeeds = useAppStore((s) => s.setSpecialNeeds);

  const toggleNeed = (need: string) => {
    if (specialNeeds.includes(need)) {
      setSpecialNeeds(specialNeeds.filter((n) => n !== need));
    } else {
      setSpecialNeeds([...specialNeeds, need]);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary mb-1">
          {t('profileTitle')}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed">
          {t('profileDesc')}
        </p>
      </div>

      {/* Residence type */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)]">
          {t('residenceType')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {RESIDENCE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setResidenceType(type)}
              className={[
                'cursor-pointer rounded-lg border px-3 py-2 text-sm font-[family-name:var(--font-sans)] transition-all duration-150',
                residenceType === type
                  ? 'border-accent-green/50 bg-accent-green/10 text-accent-green'
                  : 'border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
              ].join(' ')}
            >
              {t(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Special needs */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)]">
          {t('specialNeeds')}
        </label>
        <div className="flex flex-wrap gap-2">
          {SPECIAL_NEEDS.map((need) => {
            const active = specialNeeds.includes(need);
            return (
              <button
                key={need}
                type="button"
                onClick={() => toggleNeed(need)}
                className={[
                  'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-[family-name:var(--font-sans)] transition-all duration-150',
                  active
                    ? 'border-accent-green/50 bg-accent-green/10 text-accent-green'
                    : 'border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
                ].join(' ')}
              >
                {t(need)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
