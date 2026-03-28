'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { LocationSection } from './sections/location-section';
import { ResidenceSection } from './sections/residence-section';
import { HealthSection } from './sections/health-section';
import { EmergencySection } from './sections/emergency-section';
import { AlertsSection } from './sections/alerts-section';

// ── Schema ──────────────────────────────────────────────────────────────

const profileSchema = z.object({
  provinceCode: z.string().min(1),
  residenceType: z.string(),
  specialNeeds: z.array(z.string()),
  phoneNumber: z.string().default(''),
  emergencyContactName: z.string().default(''),
  emergencyContactPhone: z.string().default(''),
  medicalConditions: z.string().default(''),
  mobilityLevel: z.string().default('full'),
  hasVehicle: z.boolean().default(false),
  hasAc: z.boolean().default(true),
  floorLevel: z.union([z.number().int().min(0), z.literal('')]).default(''),
  ageRange: z.string().default('18-64'),
  alertSeverityThreshold: z.number().min(1).max(5).default(3),
  alertDelivery: z.string().default('push'),
  hazardPreferences: z.array(z.string()).default([]),
});

export type ProfileFormData = z.output<typeof profileSchema>;

// ── camelCase to snake_case conversion ──────────────────────────────────

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toSnakeCasePayload(data: ProfileFormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[toSnakeCase(key)] = value;
  }
  // Convert empty string floor_level to null for backend
  if (result.floor_level === '' || result.floor_level === undefined) {
    result.floor_level = null;
  }
  return result;
}

function fromSnakeCasePayload(data: Record<string, unknown>): Partial<ProfileFormData> {
  const mapping: Record<string, keyof ProfileFormData> = {
    province_code: 'provinceCode',
    residence_type: 'residenceType',
    special_needs: 'specialNeeds',
    phone_number: 'phoneNumber',
    emergency_contact_name: 'emergencyContactName',
    emergency_contact_phone: 'emergencyContactPhone',
    medical_conditions: 'medicalConditions',
    mobility_level: 'mobilityLevel',
    has_vehicle: 'hasVehicle',
    has_ac: 'hasAc',
    floor_level: 'floorLevel',
    age_range: 'ageRange',
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      provinceCode,
      residenceType,
      specialNeeds,
      phoneNumber: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      medicalConditions: '',
      mobilityLevel: 'full',
      hasVehicle: false,
      hasAc: true,
      floorLevel: '',
      ageRange: '18-64',
      alertSeverityThreshold: 3,
      alertDelivery: 'push',
      hazardPreferences: [],
    },
  });

  // Fetch profile from backend on mount if authenticated
  const fetchProfile = useCallback(async () => {
    if (!backendToken) return;
    try {
      const res = await apiFetch('/api/account/me');
      if (res.ok) {
        const data = await res.json();
        const mapped = fromSnakeCasePayload(data);
        reset({
          provinceCode: (mapped.provinceCode as string) || provinceCode,
          residenceType: (mapped.residenceType as string) || residenceType,
          specialNeeds: (mapped.specialNeeds as string[]) || specialNeeds,
          phoneNumber: (mapped.phoneNumber as string) || '',
          emergencyContactName: (mapped.emergencyContactName as string) || '',
          emergencyContactPhone: (mapped.emergencyContactPhone as string) || '',
          medicalConditions: (mapped.medicalConditions as string) || '',
          mobilityLevel: (mapped.mobilityLevel as string) || 'full',
          hasVehicle: (mapped.hasVehicle as boolean) || false,
          hasAc: mapped.hasAc !== undefined ? (mapped.hasAc as boolean) : true,
          floorLevel: mapped.floorLevel != null ? (mapped.floorLevel as number) : '',
          ageRange: (mapped.ageRange as string) || '18-64',
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
        const res = await apiFetch('/api/account/me', {
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
      <LocationSection control={control} />
      <ResidenceSection control={control} />
      <EmergencySection control={control} />
      <HealthSection control={control} />
      <AlertsSection control={control} watch={watch} />

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || saving}>
          {t('saveProfile')}
        </Button>
      </div>
    </form>
  );
}
