'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const STORAGE_KEY = 'truerisk-cookie-consent';

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) !== 'dismissed';
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function CookieBanner() {
  const t = useTranslations('Legal.cookieBanner');
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    window.dispatchEvent(new StorageEvent('storage'));
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-bg-card/95 backdrop-blur-xl p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t('message')}{' '}
                  <Link
                    href="/cookies"
                    className="text-accent-blue underline underline-offset-2 transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue rounded"
                  >
                    {t('learnMore')}
                  </Link>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={dismiss}
                  className="inline-flex h-9 items-center rounded-lg bg-accent-green px-4 text-sm font-medium text-bg-primary transition-[transform,filter] hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card"
                >
                  {t('dismiss')}
                </button>
                <button
                  onClick={dismiss}
                  aria-label="Close"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text-primary hover:bg-bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
