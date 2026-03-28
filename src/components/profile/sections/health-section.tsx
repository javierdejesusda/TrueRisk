'use client';

import { Controller, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioIndicator, CheckboxItem } from '../shared/form-primitives';
import type { ProfileFormData } from '../profile-form';

const MOBILITY_LEVELS = ['full', 'limited', 'wheelchair'] as const;
const AGE_RANGES = ['0-5', '6-17', '18-64', '65+'] as const;

interface HealthSectionProps {
  control: Control<ProfileFormData>;
}

export function HealthSection({ control }: HealthSectionProps) {
  const t = useTranslations('Profile');

  return (
    <>
      {/* Health & Mobility */}
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
          {t('healthTitle')}
        </h2>
        <div className="flex flex-col gap-5">
          {/* Medical conditions textarea */}
          <Controller
            name="medicalConditions"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="medical-conditions"
                  className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)]"
                >
                  {t('medicalConditions')}
                </label>
                <textarea
                  id="medical-conditions"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t('medicalConditionsPlaceholder')}
                  rows={3}
                  className={[
                    'w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary',
                    'placeholder:text-text-muted',
                    'transition-all duration-150',
                    'focus:outline-none',
                    'border-border hover:border-border-hover focus:border-accent-green/60 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]',
                    'resize-none font-[family-name:var(--font-sans)]',
                  ].join(' ')}
                />
              </div>
            )}
          />

          {/* Mobility level radio cards */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
              {t('mobilityLevel')}
            </label>
            <Controller
              name="mobilityLevel"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label={t('mobilityLevel')}>
                  {MOBILITY_LEVELS.map((level) => {
                    const isActive = field.value === level;
                    return (
                      <div
                        key={level}
                        role="radio"
                        aria-checked={isActive}
                        tabIndex={0}
                        onClick={() => field.onChange(level)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            field.onChange(level);
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
                          {t(`mobility_${level}`)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* Vehicle access checkbox */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
              {t('vehicleAccess')}
            </label>
            <Controller
              name="hasVehicle"
              control={control}
              render={({ field }) => (
                <CheckboxItem
                  checked={field.value}
                  label={t('hasVehicle')}
                  onToggle={() => field.onChange(!field.value)}
                />
              )}
            />
          </div>
        </div>
      </Card>

      {/* Heat Vulnerability Profile */}
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
          {t('heatProfileTitle')}
        </h2>
        <div className="flex flex-col gap-5">
          {/* Age range radio cards */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
              {t('ageRange')}
            </label>
            <Controller
              name="ageRange"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label={t('ageRange')}>
                  {AGE_RANGES.map((range) => {
                    const isActive = field.value === range;
                    return (
                      <div
                        key={range}
                        role="radio"
                        aria-checked={isActive}
                        tabIndex={0}
                        onClick={() => field.onChange(range)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            field.onChange(range);
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
                          {t(`age_${range}` as 'age_0-5' | 'age_6-17' | 'age_18-64' | 'age_65+')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* AC checkbox */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
              {t('acLabel')}
            </label>
            <Controller
              name="hasAc"
              control={control}
              render={({ field }) => (
                <CheckboxItem
                  checked={field.value}
                  label={t('hasAc')}
                  onToggle={() => field.onChange(!field.value)}
                />
              )}
            />
          </div>

          {/* Floor level */}
          <Controller
            name="floorLevel"
            control={control}
            render={({ field }) => (
              <Input
                label={t('floorLevel')}
                type="number"
                value={field.value === '' ? '' : String(field.value)}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === '' ? '' : Number(val));
                }}
                onBlur={field.onBlur}
                placeholder={t('floorLevelPlaceholder')}
              />
            )}
          />
        </div>
      </Card>
    </>
  );
}
