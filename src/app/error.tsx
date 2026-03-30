'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-red/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-text-primary">Something went wrong</h1>
        <p className="max-w-md text-sm text-text-muted">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="rounded-lg bg-accent-green px-6 py-2 text-sm font-semibold text-bg-primary hover:brightness-110"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
