'use client';

import { Controller, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ProfileFormData } from '../profile-form';

interface EmergencySectionProps {
  control: Control<ProfileFormData>;
}

export function EmergencySection({ control }: EmergencySectionProps) {
  const t = useTranslations('Profile');

  return (
    <>
      {/* Phone Number */}
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
          {t('phoneTitle')}
        </h2>
        <div className="flex flex-col gap-4">
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <Input
                label={t('phoneNumber')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={t('phonePlaceholder')}
              />
            )}
          />
          <p className="text-xs text-text-muted">{t('phoneDesc')}</p>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
          {t('emergencyContactTitle')}
        </h2>
        <div className="flex flex-col gap-4">
          <Controller
            name="emergencyContactName"
            control={control}
            render={({ field }) => (
              <Input
                label={t('emergencyContactName')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <Controller
            name="emergencyContactPhone"
            control={control}
            render={({ field }) => (
              <Input
                label={t('emergencyContactPhone')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={t('emergencyContactPhonePlaceholder')}
              />
            )}
          />
        </div>
      </Card>
    </>
  );
}
