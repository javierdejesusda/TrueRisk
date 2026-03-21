'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { apiFetch } from '@/lib/api-client';
import { PROVINCES } from '@/lib/provinces';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { showToast } from '@/components/ui/toast';

// ── Constants ───────────────────────────────────────────────────────────

const RESIDENCE_TYPES = ['apartment', 'house', 'rural', 'other'] as const;
const SPECIAL_NEEDS = ['elderly', 'children', 'pets', 'disability', 'medical'] as const;
const MOBILITY_LEVELS = ['full', 'limited', 'wheelchair'] as const;
const ALERT_DELIVERY_OPTIONS = ['push', 'sms', 'both'] as const;
const HAZARD_TYPES = ['flood', 'wildfire', 'drought', 'heatwave', 'seismic', 'coldwave', 'windstorm'] as const;

// ── Schema ──────────────────────────────────────────────────────────────

const profileSchema = z.object({
  provinceCode: z.string().min(1),
  residenceType: z.string(),
  specialNeeds: z.array(z.string()),
  emergencyContactName: z.string().default(''),
  emergencyContactPhone: z.string().default(''),
  medicalConditions: z.string().default(''),
  mobilityLevel: z.string().default('full'),
  hasVehicle: z.boolean().default(false),
  alertSeverityThreshold: z.number().min(1).max(5).default(3),
  alertDelivery: z.string().default('push'),
  hazardPreferences: z.array(z.string()).default([]),
});

type ProfileFormData = z.output<typeof profileSchema>;

// ── camelCase to snake_case conversion ──────────────────────────────────

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toSnakeCasePayload(data: ProfileFormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[toSnakeCase(key)] = value;
  }
  return result;
}

function fromSnakeCasePayload(data: Record<string, unknown>): Partial<ProfileFormData> {
  const mapping: Record<string, keyof ProfileFormData> = {
    province_code: 'provinceCode',
    residence_type: 'residenceType',
    special_needs: 'specialNeeds',
    emergency_contact_name: 'emergencyContactName',
    emergency_contact_phone: 'emergencyContactPhone',
    medical_conditions: 'medicalConditions',
    mobility_level: 'mobilityLevel',
    has_vehicle: 'hasVehicle',
    alert_severity_threshold: 'alertSeverityThreshold',
    alert_delivery: 'alertDelivery',
    hazard_preferences: 'hazardPreferences',
  };

  const result: Record<string, unknown> = {};
  for (const [snakeKey, camelKey] of Object.entries(mapping)) {
    if (snakeKey in data) {
      result[camelKey] = data[snakeKey];
    }
  }
  return result as Partial<ProfileFormData>;
}

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
  const backendToken = useAppStore((s) => s.backendToken);

  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      provinceCode,
      residenceType,
      specialNeeds,
      emergencyContactName: '',
      emergencyContactPhone: '',
      medicalConditions: '',
      mobilityLevel: 'full',
      hasVehicle: false,
      alertSeverityThreshold: 3,
      alertDelivery: 'push',
      hazardPreferences: [],
    },
  });

  const currentThreshold = watch('alertSeverityThreshold');

  // Fetch profile from backend on mount if authenticated
  const fetchProfile = useCallback(async () => {
    if (!backendToken) return;
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        const mapped = fromSnakeCasePayload(data);
        reset({
          provinceCode: (mapped.provinceCode as string) || provinceCode,
          residenceType: (mapped.residenceType as string) || residenceType,
          specialNeeds: (mapped.specialNeeds as string[]) || specialNeeds,
          emergencyContactName: (mapped.emergencyContactName as string) || '',
          emergencyContactPhone: (mapped.emergencyContactPhone as string) || '',
          medicalConditions: (mapped.medicalConditions as string) || '',
          mobilityLevel: (mapped.mobilityLevel as string) || 'full',
          hasVehicle: (mapped.hasVehicle as boolean) || false,
          alertSeverityThreshold: (mapped.alertSeverityThreshold as number) || 3,
          alertDelivery: (mapped.alertDelivery as string) || 'push',
          hazardPreferences: (mapped.hazardPreferences as string[]) || [],
        });
      }
    } catch {
      // Silently fail — form will use Zustand defaults
    }
  }, [backendToken, provinceCode, residenceType, specialNeeds, reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Sync form with store when store values change (e.g. hydration) and not authenticated
  useEffect(() => {
    if (!backendToken) {
      reset((prev) => ({ ...prev, provinceCode, residenceType, specialNeeds }));
    }
  }, [provinceCode, residenceType, specialNeeds, reset, backendToken]);

  async function onSubmit(data: ProfileFormData) {
    // Always sync Zustand for immediate UI updates
    setProvinceCode(data.provinceCode);
    setResidenceType(data.residenceType);
    setSpecialNeeds(data.specialNeeds);

    if (backendToken) {
      setSaving(true);
      try {
        const payload = toSnakeCasePayload(data);
        const res = await apiFetch('/api/auth/me', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const responseData = await res.json();
          const mapped = fromSnakeCasePayload(responseData);
          if (mapped.provinceCode) setProvinceCode(mapped.provinceCode as string);
          if (mapped.residenceType) setResidenceType(mapped.residenceType as string);
          if (mapped.specialNeeds) setSpecialNeeds(mapped.specialNeeds as string[]);
          reset(data);
          showToast({ title: t('saved'), severity: 1 });
        } else {
          showToast({ title: t('saveError'), severity: 4 });
        }
      } catch {
        showToast({ title: t('saveError'), severity: 4 });
      } finally {
        setSaving(false);
      }
    } else {
      reset(data);
      showToast({ title: t('saved'), severity: 1 });
    }
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
                    <RadioIndicator active={isActive} />
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
                  <CheckboxItem
                    key={need}
                    checked={isChecked}
                    label={t(`need_${need}`)}
                    onToggle={() => {
                      const next = isChecked
                        ? field.value.filter((n) => n !== need)
                        : [...field.value, need];
                      field.onChange(next);
                    }}
                  />
                );
              })}
            </div>
          )}
        />
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
                <div className="grid grid-cols-3 gap-3">
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

      {/* Alert Preferences */}
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

          {/* Alert delivery radio cards */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
              {t('alertDelivery')}
            </label>
            <Controller
              name="alertDelivery"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-3">
                  {ALERT_DELIVERY_OPTIONS.map((option) => {
                    const isActive = field.value === option;
                    return (
                      <div
                        key={option}
                        role="radio"
                        aria-checked={isActive}
                        tabIndex={0}
                        onClick={() => field.onChange(option)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            field.onChange(option);
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
                          {t(`delivery_${option}`)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          </div>

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

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || saving}>
          {t('saveProfile')}
        </Button>
      </div>
    </form>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────

function RadioIndicator({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        active ? 'border-accent-green' : 'border-text-muted',
      ].join(' ')}
    >
      {active && <span className="h-2 w-2 rounded-full bg-accent-green" />}
    </span>
  );
}

function CheckboxItem({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={[
        'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/50',
        checked
          ? 'border-accent-green/60 bg-accent-green/5'
          : 'border-border bg-bg-secondary/50 hover:border-border-hover',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
          checked ? 'border-accent-green bg-accent-green' : 'border-text-muted',
        ].join(' ')}
      >
        {checked && (
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
          checked ? 'text-text-primary' : 'text-text-secondary',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  );
}
