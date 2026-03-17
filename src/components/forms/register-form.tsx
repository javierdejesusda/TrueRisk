'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PROVINCES } from '@/lib/constants/provinces';
import { RESIDENCE_TYPES } from '@/lib/constants/residence-types';

const SPECIAL_NEEDS_OPTIONS = [
  { value: 'wheelchair', label: 'Wheelchair' },
  { value: 'elderly', label: 'Elderly' },
  { value: 'children', label: 'Children' },
  { value: 'pets', label: 'Pets' },
  { value: 'medical_equipment', label: 'Medical Equipment' },
  { value: 'hearing_impaired', label: 'Hearing Impaired' },
  { value: 'visual_impaired', label: 'Visual Impaired' },
  { value: 'respiratory', label: 'Respiratory' },
] as const;

const registerSchema = z.object({
  nickName: z.string().min(3, 'Nickname must be at least 3 characters'),
  teamName: z.string().min(1, 'Team name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  province: z.string().min(1, 'Province is required'),
  residenceType: z.string().min(1, 'Residence type is required'),
  specialNeeds: z.array(z.string()),
  role: z.string(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const provinceOptions = Object.entries(PROVINCES).map(([code, info]) => ({
  value: code,
  label: info.name,
}));

const residenceTypeOptions = Object.entries(RESIDENCE_TYPES).map(([key, info]) => ({
  value: key,
  label: info.label,
}));

const roleOptions = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'backoffice', label: 'Backoffice' },
];

export function RegisterForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nickName: '',
      teamName: '',
      password: '',
      province: '',
      residenceType: '',
      specialNeeds: [],
      role: 'citizen',
    },
  });

  const selectedNeeds = watch('specialNeeds') ?? [];

  function handleNeedToggle(need: string) {
    const current = selectedNeeds;
    const updated = current.includes(need)
      ? current.filter((n) => n !== need)
      : [...current, need];
    setValue('specialNeeds', updated, { shouldValidate: true });
  }

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setApiError(result.error ?? 'Registration failed');
        return;
      }

      const role = result.user?.role;
      if (role === 'backoffice') {
        router.push('/backoffice');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {apiError && (
        <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {apiError}
        </div>
      )}

      <Input
        label="Nickname"
        placeholder="Enter your nickname"
        error={errors.nickName?.message}
        {...register('nickName')}
      />

      <Input
        label="Team Name"
        placeholder="Enter your team name"
        error={errors.teamName?.message}
        {...register('teamName')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Min. 6 characters"
        error={errors.password?.message}
        {...register('password')}
      />

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
        <div className="grid grid-cols-2 gap-2">
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

      <Select
        label="Role"
        options={roleOptions}
        error={errors.role?.message}
        {...register('role')}
      />

      <Button type="submit" loading={isLoading} className="mt-2 w-full">
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
