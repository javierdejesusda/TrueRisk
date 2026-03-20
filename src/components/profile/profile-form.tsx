'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { PROVINCES } from '@/lib/provinces';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { showToast } from '@/components/ui/toast';

// ── Schema ──────────────────────────────────────────────────────────────

const RESIDENCE_TYPES = ['apartment', 'house', 'rural', 'other'] as const;
const SPECIAL_NEEDS = ['elderly', 'children', 'pets', 'disability', 'medical'] as const;

const profileSchema = z.object({
  provinceCode: z.string().min(1),
  residenceType: z.string(),
  specialNeeds: z.array(z.string()),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ── Province options ────────────────────────────────────────────────────

const provinceOptions = PROVINCES
  .map((p) => ({ value: p.code, label: p.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

// ── Component ───────────────────────────────────────────────────────────

export function ProfileForm() {
  const t = useTranslations('Profile');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const residenceType = useAppStore((s) => s.residenceType);
  const specialNeeds = useAppStore((s) => s.specialNeeds);
  const setProvinceCode = useAppStore((s) => s.setProvinceCode);
  const setResidenceType = useAppStore((s) => s.setResidenceType);
  const setSpecialNeeds = useAppStore((s) => s.setSpecialNeeds);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      provinceCode,
      residenceType,
      specialNeeds,
    },
  });

  // Sync form with store when store values change (e.g. hydration)
  useEffect(() => {
    reset({ provinceCode, residenceType, specialNeeds });
  }, [provinceCode, residenceType, specialNeeds, reset]);

  function onSubmit(data: ProfileFormData) {
    setProvinceCode(data.provinceCode);
    setResidenceType(data.residenceType);
    setSpecialNeeds(data.specialNeeds);
    showToast({ title: t('saved'), severity: 1 });
    reset(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Province selector */}
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

      {/* Residence type radio cards */}
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
          {t('residenceTitle')}
        </h2>
        <Controller
          name="residenceType"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-3">
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
                    {/* Radio indicator */}
                    <span
                      className={[
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        isActive ? 'border-accent-green' : 'border-text-muted',
                      ].join(' ')}
                    >
                      {isActive && (
                        <span className="h-2 w-2 rounded-full bg-accent-green" />
                      )}
                    </span>
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
                  <div
                    key={need}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onClick={() => {
                      const next = isChecked
                        ? field.value.filter((n) => n !== need)
                        : [...field.value, need];
                      field.onChange(next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const next = isChecked
                          ? field.value.filter((n) => n !== need)
                          : [...field.value, need];
                        field.onChange(next);
                      }
                    }}
                    className={[
                      'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/50',
                      isChecked
                        ? 'border-accent-green/60 bg-accent-green/5'
                        : 'border-border bg-bg-secondary/50 hover:border-border-hover',
                    ].join(' ')}
                  >
                    {/* Checkbox indicator */}
                    <span
                      className={[
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                        isChecked
                          ? 'border-accent-green bg-accent-green'
                          : 'border-text-muted',
                      ].join(' ')}
                    >
                      {isChecked && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#050508"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span
                      className={[
                        'text-sm font-medium transition-colors',
                        isChecked ? 'text-text-primary' : 'text-text-secondary',
                      ].join(' ')}
                    >
                      {t(`need_${need}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        />
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty}>
          {t('saveProfile')}
        </Button>
      </div>
    </form>
  );
}
