'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { apiFetch } from '@/lib/api-client';
import { useAppStore } from '@/store/app-store';

export function NotificationChannels() {
  const t = useTranslations('NotificationChannels');
  const tProfile = useTranslations('Profile');
  const backendToken = useAppStore((s) => s.backendToken);
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [telegramInstructions, setTelegramInstructions] = useState<string | null>(null);
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  async function handleLinkTelegram() {
    if (!backendToken) return;
    setTelegramLoading(true);
    try {
      const res = await apiFetch('/api/v1/telegram/link', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTelegramCode(data.code);
        setTelegramInstructions(data.instructions);
        setTelegramDeepLink(data.deep_link || null);
      }
    } catch {
      // Silently fail
    } finally {
      setTelegramLoading(false);
    }
  }

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
        {t('title')}
      </h2>

      <div className="flex flex-col gap-4">
        {/* Push Notifications */}
        {isSupported && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-primary">{t('push')}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {tProfile('pushDescription')}
              </p>
            </div>
            <ToggleSwitch
              checked={isSubscribed}
              disabled={isLoading}
              onToggle={() => (isSubscribed ? unsubscribe() : subscribe())}
            />
          </div>
        )}

        {/* WhatsApp */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary">{t('whatsapp')}</p>
            <p className="text-xs text-text-muted mt-0.5">{t('whatsappDesc')}</p>
          </div>
          <span className="text-xs text-text-muted font-[family-name:var(--font-mono)]">
            {t('sms')}
          </span>
        </div>

        {/* Telegram */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-primary">{t('telegram')}</p>
              <p className="text-xs text-text-muted mt-0.5">{t('telegramDesc')}</p>
            </div>
            {backendToken && !telegramCode && (
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
            )}
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
