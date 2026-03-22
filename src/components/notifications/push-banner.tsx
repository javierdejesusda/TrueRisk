'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const DISMISSED_KEY = 'truerisk-push-dismissed';

export function PushBanner() {
  const t = useTranslations('Community');
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage on mount is intentional
    setDismissed(localStorage.getItem(DISMISSED_KEY) === '1');
  }, []);

  if (!isSupported || isSubscribed || dismissed) return null;

  const handleEnable = async () => {
    const ok = await subscribe();
    if (!ok) localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-md animate-in fade-in slide-in-from-top-2">
      <div className="glass-heavy rounded-xl border border-white/10 px-4 py-3 flex items-center gap-3">
        <div className="shrink-0 h-8 w-8 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green text-sm font-[family-name:var(--font-mono)]">
          !
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-[family-name:var(--font-sans)] text-xs font-medium text-text-primary">{t('pushTitle')}</p>
          <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted">{t('pushDescription')}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="font-[family-name:var(--font-sans)] cursor-pointer text-[10px] text-text-muted hover:text-text-secondary px-2 py-1"
          >
            {t('pushDisable')}
          </button>
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="font-[family-name:var(--font-sans)] cursor-pointer text-[10px] font-medium bg-accent-green/20 text-accent-green hover:bg-accent-green/30 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? '...' : t('pushEnable')}
          </button>
        </div>
      </div>
    </div>
  );
}
