'use client';

import { useReducer } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { useAlertPreferences } from '@/hooks/use-alert-preferences';

interface FormState {
  quietStart: string;
  quietEnd: string;
  emergencyOverride: boolean;
  batchInterval: number;
  escalation: boolean;
  dirty: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: string; value: string | number | boolean }
  | { type: 'RESET'; prefs: FormState };

function formReducer(state: FormState, action: FormAction): FormState {
  if (action.type === 'RESET') return { ...action.prefs, dirty: false };
  return { ...state, [action.field]: action.value, dirty: true };
}

export function AlertIntelligencePrefs() {
  const t = useTranslations('AlertIntelligence');
  const { preferences, isLoading, updatePreferences } = useAlertPreferences();

  const initial: FormState = {
    quietStart: preferences?.quiet_hours_start ?? '',
    quietEnd: preferences?.quiet_hours_end ?? '',
    emergencyOverride: preferences?.emergency_override ?? true,
    batchInterval: preferences?.batch_interval_minutes ?? 30,
    escalation: preferences?.escalation_enabled ?? true,
    dirty: false,
  };

  const [form, dispatch] = useReducer(formReducer, initial);

  async function save() {
    await updatePreferences({
      quiet_hours_start: form.quietStart || null,
      quiet_hours_end: form.quietEnd || null,
      emergency_override: form.emergencyOverride,
      batch_interval_minutes: form.batchInterval,
      escalation_enabled: form.escalation,
    });
    dispatch({ type: 'SET_FIELD', field: 'dirty', value: false });
  }

  if (isLoading) {
    return (
      <Card variant="glass" padding="md">
        <div className="h-24 flex items-center justify-center text-text-muted text-sm">Loading...</div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="md">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary mb-4">
        {t('quietHours')}
      </h3>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-secondary w-16">{t('quietHoursStart')}</label>
          <input
            type="time"
            value={form.quietStart}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'quietStart', value: e.target.value })}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-text-primary focus:outline-none focus:border-accent-green/30"
          />
          <label className="text-sm text-text-secondary w-10">{t('quietHoursEnd')}</label>
          <input
            type="time"
            value={form.quietEnd}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'quietEnd', value: e.target.value })}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-text-primary focus:outline-none focus:border-accent-green/30"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.emergencyOverride}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'emergencyOverride', value: e.target.checked })}
            className="w-4 h-4 rounded accent-accent-green"
          />
          <div>
            <span className="text-sm text-text-primary">{t('emergencyOverride')}</span>
            <p className="text-xs text-text-muted">{t('emergencyOverrideDesc')}</p>
          </div>
        </label>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-secondary">{t('batchInterval')}</label>
          <select
            value={form.batchInterval}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'batchInterval', value: Number(e.target.value) })}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-text-primary focus:outline-none focus:border-accent-green/30"
          >
            <option value={15}>15 {t('minutes')}</option>
            <option value={30}>30 {t('minutes')}</option>
            <option value={60}>60 {t('minutes')}</option>
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.escalation}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'escalation', value: e.target.checked })}
            className="w-4 h-4 rounded accent-accent-green"
          />
          <div>
            <span className="text-sm text-text-primary">{t('escalation')}</span>
            <p className="text-xs text-text-muted">{t('escalationDesc')}</p>
          </div>
        </label>

        <button
          type="button"
          onClick={save}
          className="mt-2 self-start px-4 py-2 rounded-lg bg-accent-green/10 text-accent-green text-sm font-medium hover:bg-accent-green/20 transition-colors cursor-pointer"
        >
          Save Preferences
        </button>
      </div>
    </Card>
  );
}
