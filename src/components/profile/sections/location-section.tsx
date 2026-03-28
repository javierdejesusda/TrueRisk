'use client';

import { Controller, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { PROVINCES } from '@/lib/provinces';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import type { ProfileFormData } from '../profile-form';

const provinceOptions = PROVINCES
  .map((p) => ({ value: p.code, label: p.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

interface LocationSectionProps {
  control: Control<ProfileFormData>;
}

export function LocationSection({ control }: LocationSectionProps) {
  const t = useTranslations('Profile');

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
        {t('locationTitle')}
      </h2>
      <Controller
        name="provinceCode"
        control={control}
        render={({ field }) => (
          <Select
            label={t('province')}
            options={provinceOptions}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />
    </Card>
  );
}
