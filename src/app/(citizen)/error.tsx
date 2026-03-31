'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';

export default function CitizenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(true);
  const retryCount = useRef(0);
  const maxRetries = 2;

  const attemptRetry = useCallback(() => {
    if (retryCount.current < maxRetries) {
      retryCount.current += 1;
      const delay = retryCount.current * 2000; // 2s, 4s
      setTimeout(() => {
        reset();
      }, delay);
    } else {
      setRetrying(false);
    }
  }, [reset]);

  useEffect(() => {
    Sentry.captureException(error);
    attemptRetry();
  }, [error, attemptRetry]);

  const isNetwork = error.message?.includes('fetch') || error.message?.includes('network');
  const message = isNetwork
    ? 'Unable to connect to the server. Check your internet connection.'
    : error.message || 'Could not load the requested data.';

  // Show minimal spinner while retrying
  if (retrying) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Retrying... ({retryCount.current}/{maxRetries})</p>
        </div>
      </div>
    );
  }

  const lastSynced = typeof window !== 'undefined'
    ? localStorage.getItem('truerisk-last-synced')
    : null;

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
        {isNetwork && (
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <Link
              href="/emergency"
              className="text-sm text-accent-green hover:underline font-medium"
            >
              View offline emergency data
            </Link>
            {lastSynced && (
              <p className="text-xs text-text-muted">
                Last synced: {new Date(lastSynced).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
