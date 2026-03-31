'use client';

import { Controller, type Control, type UseFormWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { CheckboxItem } from '../shared/form-primitives';
import type { ProfileFormData } from '../profile-form';

const HAZARD_TYPES = ['flood', 'wildfire', 'drought', 'heatwave', 'seismic', 'coldwave', 'windstorm'] as const;

interface AlertsSectionProps {
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
}

export function AlertsSection({ control, watch }: AlertsSectionProps) {
  const t = useTranslations('Profile');
  const currentThreshold = watch('alertSeverityThreshold');

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
        {t('alertPreferencesTitle')}
      </h2>
      <div className="flex flex-col gap-5">
        {/* Severity threshold slider */}
        <Controller
          name="alertSeverityThreshold"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)]">
                {t('severityThreshold')}
              </label>
              <p className="text-xs text-text-muted">{t('severityThresholdDesc')}</p>
              <div className="mt-2">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-full accent-accent-green"
                />
                <div className="flex justify-between mt-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <span
                      key={val}
                      className={[
                        'text-xs font-[family-name:var(--font-mono)] transition-colors',
                        currentThreshold === val ? 'text-accent-green font-bold' : 'text-text-muted',
                      ].join(' ')}
                    >
                      {t(`severity_${val}` as 'severity_1' | 'severity_2' | 'severity_3' | 'severity_4' | 'severity_5')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        />

        {/* Hazard preferences checkboxes */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-1 block">
            {t('hazardPreferences')}
          </label>
          <p className="text-xs text-text-muted mb-3">{t('hazardPreferencesDesc')}</p>
          <Controller
            name="hazardPreferences"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                {HAZARD_TYPES.map((hazard) => {
                  const isChecked = field.value.includes(hazard);
                  return (
                    <CheckboxItem
                      key={hazard}
                      checked={isChecked}
                      label={t(`pref_${hazard}`)}
                      onToggle={() => {
                        const next = isChecked
                          ? field.value.filter((h) => h !== hazard)
                          : [...field.value, hazard];
                        field.onChange(next);
                      }}
                    />
                  );
                })}
              </div>
            )}
          />
        </div>
      </div>
    </Card>
  );
}
