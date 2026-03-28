'use client';

import { Controller, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { RadioIndicator, CheckboxItem } from '../shared/form-primitives';
import type { ProfileFormData } from '../profile-form';

const RESIDENCE_TYPES = ['apartment', 'house', 'rural', 'other'] as const;
const SPECIAL_NEEDS = ['elderly', 'children', 'pets', 'disability', 'medical'] as const;

interface ResidenceSectionProps {
  control: Control<ProfileFormData>;
}

export function ResidenceSection({ control }: ResidenceSectionProps) {
  const t = useTranslations('Profile');

  return (
    <>
      {/* Residence type radio cards */}
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
          {t('residenceTitle')}
        </h2>
        <Controller
          name="residenceType"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label={t('residenceTitle')}>
              {RESIDENCE_TYPES.map((type) => {
                const isActive = field.value === type;
                return (
                  <div
                    key={type}
                    role="radio"
                    aria-checked={isActive}
                    tabIndex={0}
                    onClick={() => field.onChange(type)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        field.onChange(type);
                      }
                    }}
                    className={[
                      'relative flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/50',
                      isActive
                        ? 'border-accent-green/60 bg-accent-green/5 shadow-[0_0_12px_rgba(255,255,255,0.04)]'
                        : 'border-border bg-bg-secondary/50 hover:border-border-hover',
                    ].join(' ')}
                  >
                    <RadioIndicator active={isActive} />
                    <span
                      className={[
                        'text-sm font-medium transition-colors',
                        isActive ? 'text-text-primary' : 'text-text-secondary',
                      ].join(' ')}
                    >
                      {t(`residence_${type}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        />
      </Card>

      {/* Special needs checkboxes */}
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">
          {t('specialNeedsTitle')}
        </h2>
        <p className="text-xs text-text-muted mb-4">{t('specialNeedsDesc')}</p>
        <Controller
          name="specialNeeds"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              {SPECIAL_NEEDS.map((need) => {
                const isChecked = field.value.includes(need);
                return (
                  <CheckboxItem
                    key={need}
                    checked={isChecked}
                    label={t(`need_${need}`)}
                    onToggle={() => {
                      const next = isChecked
                        ? field.value.filter((n) => n !== need)
                        : [...field.value, need];
                      field.onChange(next);
                    }}
                  />
                );
              })}
            </div>
          )}
        />
      </Card>
    </>
  );
}
