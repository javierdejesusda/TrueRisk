'use client';

export default function CitizenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-red/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-text-primary">Data loading failed</h2>
        <p className="max-w-sm text-sm text-text-muted">{error.message || 'Could not load the requested data.'}</p>
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
