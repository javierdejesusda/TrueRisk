'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { PROVINCES } from '@/lib/constants/provinces';

// ── Zod schema ───────────────────────────────────────────────────────────

const HAZARD_TYPES = [
  'flood',
  'wildfire',
  'drought',
  'heatwave',
] as const;

const alertFormSchema = z.object({
  severity: z.number().int().min(1).max(5),
  hazard_type: z.enum(HAZARD_TYPES),
  province_code: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

type AlertFormData = z.infer<typeof alertFormSchema>;

// ── Select options ───────────────────────────────────────────────────────

const severityOptions = [
  { value: '1', label: '1 - Low' },
  { value: '2', label: '2 - Moderate' },
  { value: '3', label: '3 - High' },
  { value: '4', label: '4 - Very High' },
  { value: '5', label: '5 - Critical' },
];

const typeOptions = [
  { value: 'flood', label: 'Flood' },
  { value: 'wildfire', label: 'Wildfire' },
  { value: 'drought', label: 'Drought' },
  { value: 'heatwave', label: 'Heatwave' },
];

const provinceOptions = [
  { value: '', label: 'Todas (All provinces)' },
  ...Object.entries(PROVINCES).map(([code, info]) => ({
    value: code,
    label: `${info.name} (${code})`,
  })),
];

// ── Props ────────────────────────────────────────────────────────────────

export interface CreateAlertFormProps {
  defaultValues?: {
    severity?: number;
    hazard_type?: string;
    title?: string;
    description?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────

export function CreateAlertForm({
  defaultValues,
  onSuccess,
  onCancel,
}: CreateAlertFormProps) {
  const [severity, setSeverity] = useState(
    String(defaultValues?.severity ?? '3'),
  );
  const [hazardType, setHazardType] = useState(defaultValues?.hazard_type ?? 'flood');
  const [provinceCode, setProvinceCode] = useState('');
  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [description, setDescription] = useState(
    defaultValues?.description ?? '',
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    const formData: AlertFormData = {
      severity: parseInt(severity, 10),
      hazard_type: hazardType as AlertFormData['hazard_type'],
      province_code: provinceCode || undefined,
      title: title.trim(),
      description: description.trim(),
    };

    const validation = alertFormSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.detail) {
          setError(typeof json.detail === 'string' ? json.detail : 'Failed to create alert');
        } else {
          setError(json.error ?? 'Failed to create alert');
        }
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <Card padding="md">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/15 text-accent-green">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-primary">
            Alert created successfully
          </p>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Close
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Severity"
          options={severityOptions}
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          error={fieldErrors.severity}
        />

        <Select
          label="Hazard Type"
          options={typeOptions}
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
          error={fieldErrors.hazard_type}
        />
      </div>

      <Select
        label="Province"
        options={provinceOptions}
        value={provinceCode}
        onChange={(e) => setProvinceCode(e.target.value)}
        error={fieldErrors.province_code}
      />

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Alert title..."
        error={fieldErrors.title}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="alert-description"
          className="text-sm font-medium text-text-secondary"
        >
          Description
        </label>
        <textarea
          id="alert-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the alert conditions..."
          rows={4}
          className={[
            'w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-muted',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'resize-y',
            fieldErrors.description
              ? 'border-accent-red focus:ring-accent-red/40'
              : 'border-border hover:border-border-hover focus:border-accent-green focus:ring-accent-green/40',
          ].join(' ')}
        />
        {fieldErrors.description && (
          <p className="text-xs text-accent-red">{fieldErrors.description}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isLoading}>
          Create Alert
        </Button>
      </div>
    </form>
  );
}
