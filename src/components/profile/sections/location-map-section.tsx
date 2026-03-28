'use client';

import { Controller, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { PROVINCES } from '@/lib/provinces';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { ProfileFormData } from '../profile-form';

const provinceOptions = PROVINCES
  .map((p) => ({ value: p.code, label: p.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

interface LocationMapSectionProps {
  control: Control<ProfileFormData>;
}

export function LocationMapSection({ control }: LocationMapSectionProps) {
  const t = useTranslations('Profile');

  return (
    <>
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">
          {t('homeCoordinatesTitle')}
        </h2>
        <p className="text-xs text-text-muted mb-4">{t('homeCoordinatesDesc')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="homeLat"
            control={control}
            render={({ field }) => (
              <Input
                label={t('latitude')}
                type="number"
                value={field.value == null ? '' : String(field.value)}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === '' ? null : Number(val));
                }}
                onBlur={field.onBlur}
                placeholder="e.g. 40.4168"
                step="any"
              />
            )}
          />
          <Controller
            name="homeLng"
            control={control}
            render={({ field }) => (
              <Input
                label={t('longitude')}
                type="number"
                value={field.value == null ? '' : String(field.value)}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === '' ? null : Number(val));
                }}
                onBlur={field.onBlur}
                placeholder="e.g. -3.7038"
                step="any"
              />
            )}
          />
        </div>
      </Card>

      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">
          {t('workLocationTitle')}
        </h2>
        <p className="text-xs text-text-muted mb-4">{t('workLocationDesc')}</p>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="workLat"
              control={control}
              render={({ field }) => (
                <Input
                  label={t('latitude')}
                  type="number"
                  value={field.value == null ? '' : String(field.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? null : Number(val));
                  }}
                  onBlur={field.onBlur}
                  placeholder="e.g. 40.4530"
                  step="any"
                />
              )}
            />
            <Controller
              name="workLng"
              control={control}
              render={({ field }) => (
                <Input
                  label={t('longitude')}
                  type="number"
                  value={field.value == null ? '' : String(field.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? null : Number(val));
                  }}
                  onBlur={field.onBlur}
                  placeholder="e.g. -3.6883"
                  step="any"
                />
              )}
            />
          </div>
          <Controller
            name="workProvinceCode"
            control={control}
            render={({ field }) => (
              <Select
                label={t('workProvince')}
                options={provinceOptions}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={t('selectPlaceholder')}
              />
            )}
          />
          <Controller
            name="workAddress"
            control={control}
            render={({ field }) => (
              <Input
                label={t('workAddress')}
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={t('workAddressPlaceholder')}
              />
            )}
          />
        </div>
      </Card>
    </>
  );
}
