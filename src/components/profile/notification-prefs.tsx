'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function NotificationPrefs() {
  const t = useTranslations('Profile');
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  return (
    <Card variant="glass">
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
        {t('notificationsTitle')}
      </h2>

      {!isSupported ? (
        <p className="text-sm text-text-muted">{t('notificationsUnsupported')}</p>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary">
              {t('pushNotifications')}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {t('pushDescription')}
            </p>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isSubscribed}
            disabled={isLoading}
            onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isSubscribed ? 'bg-accent-green' : 'bg-border',
            ].join(' ')}
          >
            <span
              className={[
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                isSubscribed ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      )}
    </Card>
  );
}
