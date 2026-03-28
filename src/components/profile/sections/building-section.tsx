'use client';

import { Controller, type Control } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioIndicator, CheckboxItem } from '../shared/form-primitives';
import type { ProfileFormData } from '../profile-form';

const BUILDING_MATERIALS = ['concrete', 'brick', 'wood', 'stone', 'mixed'] as const;
const CONDITION_RATINGS = [1, 2, 3, 4, 5] as const;

interface BuildingSectionProps {
  control: Control<ProfileFormData>;
}

export function BuildingSection({ control }: BuildingSectionProps) {
  const t = useTranslations('Profile');

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
        {t('buildingTitle')}
      </h2>
      <div className="flex flex-col gap-5">
        <Controller
          name="constructionYear"
          control={control}
          render={({ field }) => (
            <Input
              label={t('constructionYear')}
              type="number"
              value={field.value == null ? '' : String(field.value)}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === '' ? null : Number(val));
              }}
              onBlur={field.onBlur}
              placeholder={t('constructionYearPlaceholder')}
              min={1800}
              max={2030}
            />
          )}
        />

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
            {t('buildingMaterials')}
          </label>
          <Controller
            name="buildingMaterials"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label={t('buildingMaterials')}>
                {BUILDING_MATERIALS.map((material) => {
                  const isActive = field.value === material;
                  return (
                    <div
                      key={material}
                      role="radio"
                      aria-checked={isActive}
                      tabIndex={0}
                      onClick={() => field.onChange(material)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          field.onChange(material);
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
                        {t(`material_${material}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          />
        </div>

        <Controller
          name="buildingStories"
          control={control}
          render={({ field }) => (
            <Input
              label={t('buildingStories')}
              type="number"
              value={field.value == null ? '' : String(field.value)}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === '' ? null : Number(val));
              }}
              onBlur={field.onBlur}
              placeholder={t('buildingStoriesPlaceholder')}
              min={1}
            />
          )}
        />

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
            {t('buildingFeatures')}
          </label>
          <div className="flex flex-col gap-2">
            <Controller
              name="hasBasement"
              control={control}
              render={({ field }) => (
                <CheckboxItem
                  checked={field.value}
                  label={t('hasBasement')}
                  onToggle={() => field.onChange(!field.value)}
                />
              )}
            />
            <Controller
              name="hasElevator"
              control={control}
              render={({ field }) => (
                <CheckboxItem
                  checked={field.value}
                  label={t('hasElevator')}
                  onToggle={() => field.onChange(!field.value)}
                />
              )}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)] mb-3 block">
            {t('buildingCondition')}
          </label>
          <Controller
            name="buildingCondition"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={t('buildingCondition')}>
                {CONDITION_RATINGS.map((rating) => {
                  const isActive = field.value === rating;
                  return (
                    <div
                      key={rating}
                      role="radio"
                      aria-checked={isActive}
                      tabIndex={0}
                      onClick={() => field.onChange(rating)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          field.onChange(rating);
                        }
                      }}
                      className={[
                        'flex flex-col items-center gap-1 rounded-xl border px-3 py-3 cursor-pointer transition-all duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/50',
                        isActive
                          ? 'border-accent-green/60 bg-accent-green/5 shadow-[0_0_12px_rgba(255,255,255,0.04)]'
                          : 'border-border bg-bg-secondary/50 hover:border-border-hover',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'text-lg font-bold font-[family-name:var(--font-mono)] transition-colors',
                          isActive ? 'text-accent-green' : 'text-text-muted',
                        ].join(' ')}
                      >
                        {rating}
                      </span>
                      <span
                        className={[
                          'text-[10px] font-medium transition-colors text-center leading-tight',
                          isActive ? 'text-text-primary' : 'text-text-muted',
                        ].join(' ')}
                      >
                        {t(`condition_${rating}` as Parameters<typeof t>[0])}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          />
        </div>
      </div>
    </Card>
  );
}
