'use client';

import { useTranslations } from 'next-intl';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function StepNotifications() {
  const t = useTranslations('Onboarding');
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary mb-1">
          {t('notificationsTitle')}
        </h2>
        <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed">
          {t('notificationsDesc')}
        </p>
      </div>

      {/* Push notification toggle */}
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-accent-green/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-accent-green">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={!isSupported || isLoading}
          className={[
            'cursor-pointer w-full rounded-lg px-4 py-3 text-sm font-medium font-[family-name:var(--font-sans)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
            isSubscribed
              ? 'bg-accent-green/15 text-accent-green border border-accent-green/30'
              : 'bg-bg-secondary text-text-primary border border-border hover:border-accent-green/40',
          ].join(' ')}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
            </div>
          ) : isSubscribed ? (
            <span className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              {t('enablePush')}
            </span>
          ) : (
            t('enablePush')
          )}
        </button>

        {!isSupported && (
          <p className="font-[family-name:var(--font-sans)] text-xs text-text-muted text-center">
            Push notifications are not supported in this browser.
          </p>
        )}
      </div>
    </div>
  );
}
