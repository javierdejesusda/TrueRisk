'use client';

import { Controller, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { CheckboxItem } from '../shared/form-primitives';
import type { ProfileFormData } from '../profile-form';

interface EconomicSectionProps {
  control: Control<ProfileFormData>;
}

export function EconomicSection({ control }: EconomicSectionProps) {
  const t = useTranslations('Profile');

  const incomeBracketOptions = [
    { value: 'low', label: t('income_low') },
    { value: 'medium', label: t('income_medium') },
    { value: 'high', label: t('income_high') },
  ];

  const propertyValueOptions = [
    { value: '<100k', label: t('propertyValue_under100k') },
    { value: '100k-250k', label: t('propertyValue_100k250k') },
    { value: '250k-500k', label: t('propertyValue_250k500k') },
    { value: '500k+', label: t('propertyValue_over500k') },
  ];

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">
        {t('economicTitle')}
      </h2>
      <p className="text-xs text-text-muted mb-4">{t('economicDesc')}</p>
      <div className="flex flex-col gap-5">
        <Controller
          name="incomeBracket"
          control={control}
          render={({ field }) => (
            <Select
              label={t('incomeBracket')}
              options={incomeBracketOptions}
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={t('selectPlaceholder')}
            />
          )}
        />

        <Controller
          name="propertyValueRange"
          control={control}
          render={({ field }) => (
            <Select
              label={t('propertyValueRange')}
              options={propertyValueOptions}
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={t('selectPlaceholder')}
            />
          )}
        />

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
            {t('insuranceCoverage')}
          </label>
          <div className="flex flex-col gap-2">
            <Controller
              name="hasPropertyInsurance"
              control={control}
              render={({ field }) => (
                <CheckboxItem
                  checked={field.value}
                  label={t('hasPropertyInsurance')}
                  onToggle={() => field.onChange(!field.value)}
                />
              )}
            />
            <Controller
              name="hasLifeInsurance"
              control={control}
              render={({ field }) => (
                <CheckboxItem
                  checked={field.value}
                  label={t('hasLifeInsurance')}
                  onToggle={() => field.onChange(!field.value)}
                />
              )}
            />
          </div>
        </div>

        <Controller
          name="hasEmergencySavings"
          control={control}
          render={({ field }) => (
            <CheckboxItem
              checked={field.value}
              label={t('hasEmergencySavings')}
              onToggle={() => field.onChange(!field.value)}
            />
          )}
        />
      </div>
    </Card>
  );
}
