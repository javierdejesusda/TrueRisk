'use client';

export function RadioIndicator({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        active ? 'border-accent-green' : 'border-text-muted',
      ].join(' ')}
    >
      {active && <span className="h-2 w-2 rounded-full bg-accent-green" />}
    </span>
  );
}

export function CheckboxItem({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={[
        'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/50',
        checked
          ? 'border-accent-green/60 bg-accent-green/5'
          : 'border-border bg-bg-secondary/50 hover:border-border-hover',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
          checked ? 'border-accent-green bg-accent-green' : 'border-text-muted',
        ].join(' ')}
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#050508"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>
      <span
        className={[
          'text-sm font-medium transition-colors',
          checked ? 'text-text-primary' : 'text-text-secondary',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  );
}
