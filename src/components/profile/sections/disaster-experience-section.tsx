'use client';

import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { ProfileFormData } from '../profile-form';

const HAZARD_TYPES = [
  'flood', 'wildfire', 'drought', 'heatwave',
  'seismic', 'coldwave', 'windstorm', 'tsunami',
] as const;

const SEVERITY_LEVELS = ['minor', 'moderate', 'severe'] as const;

interface DisasterExperienceSectionProps {
  control: Control<ProfileFormData>;
}

export function DisasterExperienceSection({ control }: DisasterExperienceSectionProps) {
  const t = useTranslations('Profile');

  const {
    fields,
    append,
    remove,
  } = useFieldArray({ control, name: 'disasterExperiences' });

  const hazardOptions = HAZARD_TYPES.map((h) => ({
    value: h,
    label: t(`pref_${h}` as Parameters<typeof t>[0]),
  }));

  const severityOptions = SEVERITY_LEVELS.map((s) => ({
    value: s,
    label: t(`disasterSeverity_${s}` as Parameters<typeof t>[0]),
  }));

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">
        {t('disasterExperienceTitle')}
      </h2>
      <p className="text-xs text-text-muted mb-4">{t('disasterExperienceDesc')}</p>
      <div className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-bg-secondary/30 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)]">
                {t('experienceLabel', { number: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs text-text-muted hover:text-accent-red transition-colors cursor-pointer"
              >
                {t('remove')}
              </button>
            </div>
            <Controller
              name={`disasterExperiences.${index}.hazardType`}
              control={control}
              render={({ field: f }) => (
                <Select
                  label={t('experienceHazard')}
                  options={hazardOptions}
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                />
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Controller
                name={`disasterExperiences.${index}.year`}
                control={control}
                render={({ field: f }) => (
                  <Input
                    label={t('experienceYear')}
                    type="number"
                    value={f.value == null ? '' : String(f.value)}
                    onChange={(e) => {
                      const val = e.target.value;
                      f.onChange(val === '' ? null : Number(val));
                    }}
                    onBlur={f.onBlur}
                    placeholder={t('experienceYearPlaceholder')}
                    min={1900}
                    max={2030}
                  />
                )}
              />
              <Controller
                name={`disasterExperiences.${index}.severity`}
                control={control}
                render={({ field: f }) => (
                  <Select
                    label={t('experienceSeverity')}
                    options={severityOptions}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                  />
                )}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ hazardType: 'flood', year: null, severity: 'minor' })
          }
        >
          {t('addExperience')}
        </Button>
      </div>
    </Card>
  );
}
