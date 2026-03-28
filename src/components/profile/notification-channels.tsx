'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { apiFetch } from '@/lib/api-client';
import { useAppStore } from '@/store/app-store';

interface UserProfile {
  phone_number?: string | null;
  whatsapp_enabled?: boolean;
  telegram_chat_id?: string | null;
  alert_delivery?: string;
}

export function NotificationChannels() {
  const t = useTranslations('NotificationChannels');
  const tProfile = useTranslations('Profile');
  const backendToken = useAppStore((s) => s.backendToken);
  const { isSupported, isSubscribed, isLoading, error: pushError, subscribe, unsubscribe } =
    usePushNotifications();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    if (!backendToken) return;
    apiFetch('/api/auth/me').then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setPhone(data.phone_number || '');
      }
    });
  }, [backendToken]);

  async function patchProfile(data: Record<string, unknown>) {
    const res = await apiFetch('/api/account/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      return true;
    }
    return false;
  }

  async function handleSavePhone() {
    const ok = await patchProfile({ phone_number: phone || null });
    if (ok) {
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 2000);
    }
  }

  async function handleLinkTelegram() {
    if (!backendToken) return;
    setTelegramLoading(true);
    try {
      const res = await apiFetch('/api/telegram/link', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTelegramCode(data.code);
        setTelegramDeepLink(data.deep_link || null);
      }
    } catch {
      // Silently fail
    } finally {
      setTelegramLoading(false);
    }
  }

  const hasPhone = !!(profile?.phone_number);

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
        {t('title')}
      </h2>

      <div className="flex flex-col gap-4">
        {/* Phone Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-text-muted font-[family-name:var(--font-sans)]">
            {t('phoneNumber')}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary font-[family-name:var(--font-mono)] placeholder:text-text-muted/40"
            />
            <button
              type="button"
              onClick={handleSavePhone}
              className="shrink-0 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs font-medium text-text-primary transition-all duration-150 hover:border-accent-green/60 hover:bg-accent-green/5"
            >
              {phoneSaved ? t('phoneSaved') : t('savePhone')}
            </button>
          </div>
        </div>

        <div className="border-t border-white/5" />

        {/* Push Notifications */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary">{t('push')}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {isSupported ? tProfile('pushDescription') : pushError || t('pushError')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSubscribed && (
              <button
                type="button"
                onClick={async () => {
                  const res = await apiFetch('/api/push/test', { method: 'POST' });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    alert(data.detail || 'Test failed');
                  }
                }}
                className="shrink-0 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-primary transition-all duration-150 hover:border-accent-green/60 hover:bg-accent-green/5"
              >
                {t('testPush')}
              </button>
            )}
            {isSupported && (
              <ToggleSwitch
                checked={isSubscribed}
                disabled={isLoading}
                onToggle={() => (isSubscribed ? unsubscribe() : subscribe())}
              />
            )}
          </div>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary">{t('whatsapp')}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {hasPhone ? t('whatsappDesc') : t('noPhone')}
            </p>
          </div>
          <ToggleSwitch
            checked={!!profile?.whatsapp_enabled}
            disabled={!hasPhone}
            onToggle={() => patchProfile({ whatsapp_enabled: !profile?.whatsapp_enabled })}
          />
        </div>

        {/* SMS */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary">{t('sms')}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {hasPhone ? t('smsDesc') : t('noPhone')}
            </p>
          </div>
          <ToggleSwitch
            checked={profile?.alert_delivery === 'sms'}
            disabled={!hasPhone}
            onToggle={() => patchProfile({ alert_delivery: profile?.alert_delivery === 'sms' ? 'push' : 'sms' })}
          />
        </div>

        {/* Telegram */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-primary">{t('telegram')}</p>
              <p className="text-xs text-text-muted mt-0.5">{t('telegramDesc')}</p>
            </div>
            {profile?.telegram_chat_id ? (
              <span className="shrink-0 rounded-lg bg-accent-green/10 border border-accent-green/30 px-3 py-1.5 text-xs font-medium text-accent-green">
                {t('telegramLinked')}
              </span>
            ) : backendToken && !telegramCode ? (
              <button
                type="button"
                disabled={telegramLoading}
                onClick={handleLinkTelegram}
                className={[
                  'shrink-0 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-primary',
                  'transition-all duration-150',
                  'hover:border-accent-green/60 hover:bg-accent-green/5',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                {telegramLoading ? '...' : t('linkTelegram')}
              </button>
            ) : null}
          </div>

          {/* Telegram link code display */}
          {telegramCode && (
            <div className="rounded-lg border border-accent-green/30 bg-accent-green/5 px-3 py-2">
              <p className="text-xs text-text-muted mb-1">{t('telegramInstructions')}</p>
              {telegramDeepLink ? (
                <a
                  href={telegramDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-accent-green/20 px-4 py-2 text-sm font-medium text-accent-green hover:bg-accent-green/30 transition-colors"
                >
                  {t('openTelegram')}
                </a>
              ) : (
                <code className="text-sm font-[family-name:var(--font-mono)] text-accent-green font-bold">
                  /start {telegramCode}
                </code>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-accent-green' : 'bg-border',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}
