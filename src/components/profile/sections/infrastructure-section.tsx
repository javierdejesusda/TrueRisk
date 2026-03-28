'use client';

import { Controller, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { CheckboxItem } from '../shared/form-primitives';
import type { ProfileFormData } from '../profile-form';

interface InfrastructureSectionProps {
  control: Control<ProfileFormData>;
}

export function InfrastructureSection({ control }: InfrastructureSectionProps) {
  const t = useTranslations('Profile');

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">
        {t('infrastructureTitle')}
      </h2>
      <p className="text-xs text-text-muted mb-4">{t('infrastructureDesc')}</p>
      <div className="flex flex-col gap-2">
        <Controller
          name="hasMedicalDevices"
          control={control}
          render={({ field }) => (
            <CheckboxItem
              checked={field.value}
              label={t('hasMedicalDevices')}
              onToggle={() => field.onChange(!field.value)}
            />
          )}
        />
        <Controller
          name="hasWaterStorage"
          control={control}
          render={({ field }) => (
            <CheckboxItem
              checked={field.value}
              label={t('hasWaterStorage')}
              onToggle={() => field.onChange(!field.value)}
            />
          )}
        />
        <Controller
          name="hasGenerator"
          control={control}
          render={({ field }) => (
            <CheckboxItem
              checked={field.value}
              label={t('hasGenerator')}
              onToggle={() => field.onChange(!field.value)}
            />
          )}
        />
        <Controller
          name="dependsPublicWater"
          control={control}
          render={({ field }) => (
            <CheckboxItem
              checked={field.value}
              label={t('dependsPublicWater')}
              onToggle={() => field.onChange(!field.value)}
            />
          )}
        />
      </div>
    </Card>
  );
}
