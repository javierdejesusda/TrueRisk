'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function CitizenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const isNetwork = error.message?.includes('fetch') || error.message?.includes('network');
  const message = isNetwork
    ? 'Unable to connect to the server. Check your internet connection.'
    : error.message || 'Could not load the requested data.';

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 bg-bg-primary">
      <div className="glass-heavy rounded-2xl p-8 max-w-sm w-full flex flex-col items-center gap-5 text-center animate-panel-enter">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-red/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Something went wrong</h2>
          <p className="text-sm text-text-muted leading-relaxed">{message}</p>
        </div>
        <button
          onClick={reset}
          className="rounded-xl bg-accent-green px-8 py-2.5 text-sm font-semibold text-bg-primary hover:brightness-110 transition-all cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
