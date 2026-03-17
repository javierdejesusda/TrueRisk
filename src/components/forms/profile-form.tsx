'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PROVINCES } from '@/lib/constants/provinces';
import { RESIDENCE_TYPES } from '@/lib/constants/residence-types';
import type { ResidenceType, SpecialNeed } from '@/types/user';

// ── Constants ─────────────────────────────────────────────────────────

const SPECIAL_NEEDS_OPTIONS: { value: SpecialNeed; label: string }[] = [
  { value: 'wheelchair', label: 'Wheelchair' },
  { value: 'elderly', label: 'Elderly' },
  { value: 'children', label: 'Children' },
  { value: 'pets', label: 'Pets' },
  { value: 'medical_equipment', label: 'Medical Equipment' },
  { value: 'hearing_impaired', label: 'Hearing Impaired' },
  { value: 'visual_impaired', label: 'Visual Impaired' },
  { value: 'respiratory', label: 'Respiratory' },
];

const provinceOptions = Object.entries(PROVINCES).map(([code, info]) => ({
  value: code,
  label: info.name,
}));

const residenceTypeOptions = Object.entries(RESIDENCE_TYPES).map(
  ([key, info]) => ({
    value: key,
    label: info.label,
  }),
);

// ── Schema ────────────────────────────────────────────────────────────

const profileSchema = z.object({
  province: z.string().min(1, 'Province is required'),
  residenceType: z.string().min(1, 'Residence type is required'),
  specialNeeds: z.array(z.string()),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ── Risk preview helper ───────────────────────────────────────────────

function getRiskPreview(province: string, residenceType: string): string {
  const provinceInfo = PROVINCES[province];
  const residenceInfo = RESIDENCE_TYPES[residenceType as ResidenceType];

  if (!provinceInfo && !residenceInfo) {
    return 'Select province and residence type to see risk preview.';
  }

  const parts: string[] = [];

  if (provinceInfo) {
    if (provinceInfo.riskWeight >= 0.7) {
      parts.push(
        `${provinceInfo.name} is a high-risk area for flooding and extreme weather.`,
      );
    } else if (provinceInfo.riskWeight >= 0.4) {
      parts.push(
        `${provinceInfo.name} has moderate climate risk exposure.`,
      );
    } else {
      parts.push(
        `${provinceInfo.name} has a relatively low climate risk profile.`,
      );
    }
  }

  if (residenceInfo) {
    if (residenceInfo.vulnerabilityScore >= 0.8) {
      parts.push(
        `Living in a ${residenceInfo.label.toLowerCase()} significantly increases flood vulnerability.`,
      );
    } else if (residenceInfo.vulnerabilityScore >= 0.5) {
      parts.push(
        `A ${residenceInfo.label.toLowerCase()} has moderate vulnerability to weather emergencies.`,
      );
    } else {
      parts.push(
        `A ${residenceInfo.label.toLowerCase()} offers better protection from flooding.`,
      );
    }
  }

  // Combined high-risk example
  if (
    provinceInfo &&
    residenceInfo &&
    provinceInfo.riskWeight >= 0.7 &&
    residenceInfo.vulnerabilityScore >= 0.8
  ) {
    parts.push('Higher flood risk -- consider preparing an emergency kit.');
  } else if (
    provinceInfo &&
    residenceInfo &&
    provinceInfo.riskWeight <= 0.3 &&
    residenceInfo.vulnerabilityScore <= 0.3
  ) {
    parts.push('Lower risk profile overall.');
  }

  return parts.join(' ');
}

// ── Props ─────────────────────────────────────────────────────────────

export interface ProfileFormProps {
  user: {
    id: number;
    nickName: string;
    province: string;
    residenceType: string;
    specialNeeds: string[];
    role: string;
  };
  onSaved?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────

export function ProfileForm({ user, onSaved }: ProfileFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      province: user.province,
      residenceType: user.residenceType,
      specialNeeds: user.specialNeeds,
    },
  });

  const selectedNeeds = watch('specialNeeds') ?? [];
  const watchedProvince = watch('province');
  const watchedResidence = watch('residenceType');

  function handleNeedToggle(need: string) {
    const current = selectedNeeds;
    const updated = current.includes(need)
      ? current.filter((n) => n !== need)
      : [...current, need];
    setValue('specialNeeds', updated, { shouldValidate: true });
  }

  async function onSubmit(data: ProfileFormData) {
    setIsLoading(true);
    setApiError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setApiError(result.error ?? 'Failed to update profile');
        return;
      }

      setSuccessMsg('Profile updated successfully!');
      onSaved?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const riskPreview = getRiskPreview(watchedProvince, watchedResidence);

  return (
    <div className="flex flex-col gap-6">
      {/* Read-only user info */}
      <Card padding="md">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/15 text-accent-green text-lg font-bold">
            {user.nickName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              {user.nickName}
            </h3>
            <Badge variant="neutral" size="sm">
              {user.role === 'backoffice' ? 'Backoffice' : 'Citizen'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {apiError && (
          <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {apiError}
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg border border-accent-green/30 bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
            {successMsg}
          </div>
        )}

        <Select
          label="Province"
          placeholder="Select a province"
          options={provinceOptions}
          error={errors.province?.message}
          {...register('province')}
        />

        <Select
          label="Residence Type"
          placeholder="Select residence type"
          options={residenceTypeOptions}
          error={errors.residenceType?.message}
          {...register('residenceType')}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">
            Special Needs
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SPECIAL_NEEDS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary transition-colors hover:border-border-hover"
              >
                <input
                  type="checkbox"
                  checked={selectedNeeds.includes(option.value)}
                  onChange={() => handleNeedToggle(option.value)}
                  className="h-4 w-4 rounded border-border accent-accent-green"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Risk preview */}
        {(watchedProvince || watchedResidence) && (
          <Card padding="sm" className="bg-bg-secondary">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Risk Preview
              </span>
              <p className="text-sm text-text-secondary">{riskPreview}</p>
            </div>
          </Card>
        )}

        <Button type="submit" loading={isLoading} className="mt-2 w-full">
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </div>
  );
}
