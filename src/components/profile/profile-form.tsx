'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/store/app-store';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { showToast } from '@/components/ui/toast';
import { LocationSection } from './sections/location-section';
import { ResidenceSection } from './sections/residence-section';
import { HealthSection } from './sections/health-section';
import { EmergencySection } from './sections/emergency-section';
import { AlertsSection } from './sections/alerts-section';
import { HouseholdSection } from './sections/household-section';
import { BuildingSection } from './sections/building-section';
import { EconomicSection } from './sections/economic-section';
import { InfrastructureSection } from './sections/infrastructure-section';
import { DisasterExperienceSection } from './sections/disaster-experience-section';
import { LocationMapSection } from './sections/location-map-section';

const householdMemberSchema = z.object({
  name: z.string().default(''),
  ageRange: z.string().default('18-64'),
  mobility: z.string().default('full'),
});

const petSchema = z.object({
  type: z.string().default('dog'),
  count: z.number().int().min(1).default(1),
  needsTransport: z.boolean().default(false),
});

const disasterExperienceSchema = z.object({
  hazardType: z.string().default('flood'),
  year: z.number().int().nullable().default(null),
  severity: z.string().default('minor'),
});

const profileSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
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
  // Household
  householdMembers: z.array(householdMemberSchema).default([]),
  pets: z.array(petSchema).default([]),
  // Building
  constructionYear: z.number().int().min(1800).max(2030).nullable().default(null),
  buildingMaterials: z.string().default(''),
  buildingStories: z.number().int().min(1).nullable().default(null),
  hasBasement: z.boolean().default(false),
  hasElevator: z.boolean().default(false),
  buildingCondition: z.number().int().min(1).max(5).nullable().default(null),
  // Economic
  incomeBracket: z.string().default(''),
  hasPropertyInsurance: z.boolean().default(false),
  hasLifeInsurance: z.boolean().default(false),
  propertyValueRange: z.string().default(''),
  hasEmergencySavings: z.boolean().default(false),
  // Infrastructure
  hasMedicalDevices: z.boolean().default(false),
  hasWaterStorage: z.boolean().default(false),
  hasGenerator: z.boolean().default(false),
  dependsPublicWater: z.boolean().default(true),
  // Disaster experience
  disasterExperiences: z.array(disasterExperienceSchema).default([]),
  // Location coordinates
  homeLat: z.number().nullable().default(null),
  homeLng: z.number().nullable().default(null),
  workLat: z.number().nullable().default(null),
  workLng: z.number().nullable().default(null),
  workProvinceCode: z.string().default(''),
  workAddress: z.string().default(''),
});

export type ProfileFormData = z.output<typeof profileSchema>;

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function objectToSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = value;
  }
  return result;
}

// Fields where the frontend camelCase→snake_case name differs from the backend field name
const FRONTEND_TO_BACKEND_FIELD: Record<string, string> = {
  pets: 'pet_details',
  has_medical_devices: 'has_power_dependent_medical',
  has_generator: 'has_generator_or_solar',
  home_lat: 'home_latitude',
  home_lng: 'home_longitude',
  work_lat: 'work_latitude',
  work_lng: 'work_longitude',
  disaster_experiences: 'disaster_experience',
};

function toSnakeCasePayload(data: ProfileFormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const snakeKey = toSnakeCase(key);
    const backendKey = FRONTEND_TO_BACKEND_FIELD[snakeKey] || snakeKey;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      result[backendKey] = value.map((item) => objectToSnakeCase(item as Record<string, unknown>));
    } else {
      result[backendKey] = value;
    }
  }
  // Convert empty string floor_level to null for backend (only if field is present)
  if ('floor_level' in result && (result.floor_level === '' || result.floor_level === undefined)) {
    result.floor_level = null;
  }
  // Convert empty strings to null for optional string fields (only if present)
  const nullableStringFields = [
    'building_materials', 'income_bracket', 'property_value_range',
    'work_province_code', 'work_address',
  ];
  for (const field of nullableStringFields) {
    if (field in result && result[field] === '') result[field] = null;
  }
  return result;
}

function snakeToCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function objectToCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamelCase(key)] = value;
  }
  return result;
}

function fromSnakeCasePayload(data: Record<string, unknown>): Partial<ProfileFormData> {
  const mapping: Record<string, keyof ProfileFormData> = {
    email: 'email',
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
    household_members: 'householdMembers',
    pet_details: 'pets',
    construction_year: 'constructionYear',
    building_materials: 'buildingMaterials',
    building_stories: 'buildingStories',
    has_basement: 'hasBasement',
    has_elevator: 'hasElevator',
    building_condition: 'buildingCondition',
    income_bracket: 'incomeBracket',
    has_property_insurance: 'hasPropertyInsurance',
    has_life_insurance: 'hasLifeInsurance',
    property_value_range: 'propertyValueRange',
    has_emergency_savings: 'hasEmergencySavings',
    has_power_dependent_medical: 'hasMedicalDevices',
    has_water_storage: 'hasWaterStorage',
    has_generator_or_solar: 'hasGenerator',
    depends_public_water: 'dependsPublicWater',
    disaster_experience: 'disasterExperiences',
    home_latitude: 'homeLat',
    home_longitude: 'homeLng',
    work_latitude: 'workLat',
    work_longitude: 'workLng',
    work_province_code: 'workProvinceCode',
    work_address: 'workAddress',
  };

  const arrayObjectFields = new Set(['household_members', 'pet_details', 'disaster_experience']);

  const result: Record<string, unknown> = {};
  for (const [snakeKey, camelKey] of Object.entries(mapping)) {
    if (snakeKey in data) {
      const value = data[snakeKey];
      if (arrayObjectFields.has(snakeKey) && Array.isArray(value)) {
        result[camelKey] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? objectToCamelCase(item as Record<string, unknown>)
            : item
        );
      } else {
        result[camelKey] = value;
      }
    }
  }
  return result as Partial<ProfileFormData>;
}


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

  // Refs for Zustand defaults — used as fallbacks in fetchProfile without
  // triggering re-fetches (which would wipe in-progress user edits).
  const defaultsRef = useRef({ provinceCode, residenceType, specialNeeds });
  defaultsRef.current = { provinceCode, residenceType, specialNeeds };

  // Baseline values after the last reset — used to compute which fields the
  // user actually changed at submit time.  Avoids relying on the closure-
  // captured formState.dirtyFields proxy which can be stale.
  const baselineRef = useRef<ProfileFormData | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { isDirty },
  } = useForm<ProfileFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      email: '',
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
      householdMembers: [],
      pets: [],
      constructionYear: null,
      buildingMaterials: '',
      buildingStories: null,
      hasBasement: false,
      hasElevator: false,
      buildingCondition: null,
      incomeBracket: '',
      hasPropertyInsurance: false,
      hasLifeInsurance: false,
      propertyValueRange: '',
      hasEmergencySavings: false,
      hasMedicalDevices: false,
      hasWaterStorage: false,
      hasGenerator: false,
      dependsPublicWater: true,
      disasterExperiences: [],
      homeLat: null,
      homeLng: null,
      workLat: null,
      workLng: null,
      workProvinceCode: '',
      workAddress: '',
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
        const defaults = defaultsRef.current;
        const resetValues: ProfileFormData = {
          email: (mapped.email as string) || '',
          provinceCode: (mapped.provinceCode as string) || defaults.provinceCode,
          residenceType: (mapped.residenceType as string) || defaults.residenceType,
          specialNeeds: (mapped.specialNeeds as string[]) || defaults.specialNeeds,
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
          householdMembers: (mapped.householdMembers as ProfileFormData['householdMembers']) || [],
          pets: (mapped.pets as ProfileFormData['pets']) || [],
          constructionYear: (mapped.constructionYear as number | null) ?? null,
          buildingMaterials: (mapped.buildingMaterials as string) || '',
          buildingStories: (mapped.buildingStories as number | null) ?? null,
          hasBasement: (mapped.hasBasement as boolean) || false,
          hasElevator: (mapped.hasElevator as boolean) || false,
          buildingCondition: (mapped.buildingCondition as number | null) ?? null,
          incomeBracket: (mapped.incomeBracket as string) || '',
          hasPropertyInsurance: (mapped.hasPropertyInsurance as boolean) || false,
          hasLifeInsurance: (mapped.hasLifeInsurance as boolean) || false,
          propertyValueRange: (mapped.propertyValueRange as string) || '',
          hasEmergencySavings: (mapped.hasEmergencySavings as boolean) || false,
          hasMedicalDevices: (mapped.hasMedicalDevices as boolean) || false,
          hasWaterStorage: (mapped.hasWaterStorage as boolean) || false,
          hasGenerator: (mapped.hasGenerator as boolean) || false,
          dependsPublicWater: mapped.dependsPublicWater !== undefined ? (mapped.dependsPublicWater as boolean) : true,
          disasterExperiences: (mapped.disasterExperiences as ProfileFormData['disasterExperiences']) || [],
          homeLat: (mapped.homeLat as number | null) ?? null,
          homeLng: (mapped.homeLng as number | null) ?? null,
          workLat: (mapped.workLat as number | null) ?? null,
          workLng: (mapped.workLng as number | null) ?? null,
          workProvinceCode: (mapped.workProvinceCode as string) || '',
          workAddress: (mapped.workAddress as string) || '',
        };
        reset(resetValues);
        baselineRef.current = resetValues;
      }
    } catch {
      // Silently fail — form will use Zustand defaults
    }
  }, [backendToken, reset]);

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
        // Only send fields the user actually changed to avoid overwriting
        // values set by other components (e.g. NotificationChannels toggles).
        // Compare current values against the baseline snapshot (set at last
        // reset) instead of relying on formState.dirtyFields from a closure.
        const baseline = baselineRef.current;
        const dirtyData: Partial<ProfileFormData> = {};
        for (const key of Object.keys(data) as (keyof ProfileFormData)[]) {
          const cur = data[key];
          const prev = baseline?.[key];
          if (JSON.stringify(cur) !== JSON.stringify(prev)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (dirtyData as any)[key] = cur;
          }
        }
        const payload = toSnakeCasePayload(dirtyData as ProfileFormData);
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
          baselineRef.current = data;
          showToast({ title: t('saved'), severity: 1 });
          window.dispatchEvent(new Event('profile-updated'));
        } else if (res.status === 409) {
          setError('email', { type: 'server', message: t('emailTaken') });
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
      {/* Email */}
      <Card variant="glass">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
          {t('emailLabel')}
        </h2>
        <div className="flex flex-col gap-4">
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                type="email"
                label={t('emailLabel')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={t('emailPlaceholder')}
                error={fieldState.error?.message}
              />
            )}
          />
          <p className="text-xs text-text-muted">{t('emailDescription')}</p>
        </div>
      </Card>

      <LocationSection control={control} />
      <EmergencySection control={control} />
      <HealthSection control={control} />
      <ResidenceSection control={control} />
      <HouseholdSection control={control} />
      <LocationMapSection control={control} />
      <BuildingSection control={control} />
      <InfrastructureSection control={control} />
      <DisasterExperienceSection control={control} />
      <EconomicSection control={control} />
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
