'use client';

import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckboxItem } from '../shared/form-primitives';
import type { ProfileFormData } from '../profile-form';

const AGE_RANGE_OPTIONS = [
  { value: '0-5', label: '0-5' },
  { value: '6-17', label: '6-17' },
  { value: '18-64', label: '18-64' },
  { value: '65+', label: '65+' },
];

const MOBILITY_OPTIONS = [
  { value: 'full', label: 'Full' },
  { value: 'limited', label: 'Limited' },
  { value: 'wheelchair', label: 'Wheelchair' },
];

const PET_TYPE_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'other', label: 'Other' },
];

interface HouseholdSectionProps {
  control: Control<ProfileFormData>;
}

export function HouseholdSection({ control }: HouseholdSectionProps) {
  const t = useTranslations('Profile');

  const {
    fields: memberFields,
    append: appendMember,
    remove: removeMember,
  } = useFieldArray({ control, name: 'householdMembers' });

  const {
    fields: petFields,
    append: appendPet,
    remove: removePet,
  } = useFieldArray({ control, name: 'pets' });

  return (
    <>
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">
          {t('householdTitle')}
        </h2>
        <p className="text-xs text-text-muted mb-4">{t('householdDesc')}</p>
        <div className="flex flex-col gap-4">
          {memberFields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-bg-secondary/30 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)]">
                  {t('memberLabel', { number: index + 1 })}
                </span>
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="text-xs text-text-muted hover:text-accent-red transition-colors cursor-pointer"
                >
                  {t('remove')}
                </button>
              </div>
              <Controller
                name={`householdMembers.${index}.name`}
                control={control}
                render={({ field: f }) => (
                  <Input
                    label={t('memberName')}
                    value={f.value}
                    onChange={f.onChange}
                    onBlur={f.onBlur}
                    placeholder={t('memberNamePlaceholder')}
                  />
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Controller
                  name={`householdMembers.${index}.ageRange`}
                  control={control}
                  render={({ field: f }) => (
                    <Select
                      label={t('memberAge')}
                      options={AGE_RANGE_OPTIONS.map((o) => ({
                        ...o,
                        label: t(`memberAge_${o.value}` as Parameters<typeof t>[0]),
                      }))}
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                    />
                  )}
                />
                <Controller
                  name={`householdMembers.${index}.mobility`}
                  control={control}
                  render={({ field: f }) => (
                    <Select
                      label={t('memberMobility')}
                      options={MOBILITY_OPTIONS.map((o) => ({
                        ...o,
                        label: t(`mobility_${o.value}`),
                      }))}
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
              appendMember({ name: '', ageRange: '18-64', mobility: 'full' })
            }
          >
            {t('addMember')}
          </Button>
        </div>
      </Card>

      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">
          {t('petsTitle')}
        </h2>
        <p className="text-xs text-text-muted mb-4">{t('petsDesc')}</p>
        <div className="flex flex-col gap-4">
          {petFields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-bg-secondary/30 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)]">
                  {t('petLabel', { number: index + 1 })}
                </span>
                <button
                  type="button"
                  onClick={() => removePet(index)}
                  className="text-xs text-text-muted hover:text-accent-red transition-colors cursor-pointer"
                >
                  {t('remove')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Controller
                  name={`pets.${index}.type`}
                  control={control}
                  render={({ field: f }) => (
                    <Select
                      label={t('petType')}
                      options={PET_TYPE_OPTIONS.map((o) => ({
                        ...o,
                        label: t(`petType_${o.value}` as Parameters<typeof t>[0]),
                      }))}
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                    />
                  )}
                />
                <Controller
                  name={`pets.${index}.count`}
                  control={control}
                  render={({ field: f }) => (
                    <Input
                      label={t('petCount')}
                      type="number"
                      value={String(f.value)}
                      onChange={(e) => f.onChange(Number(e.target.value))}
                      onBlur={f.onBlur}
                      min={1}
                    />
                  )}
                />
              </div>
              <Controller
                name={`pets.${index}.needsTransport`}
                control={control}
                render={({ field: f }) => (
                  <CheckboxItem
                    checked={f.value}
                    label={t('petNeedsTransport')}
                    onToggle={() => f.onChange(!f.value)}
                  />
                )}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendPet({ type: 'dog', count: 1, needsTransport: false })
            }
          >
            {t('addPet')}
          </Button>
        </div>
      </Card>
    </>
  );
}
