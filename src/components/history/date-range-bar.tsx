'use client';

export type DateRange = 7 | 30 | 90 | 365;

interface DateRangeBarProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const RANGES: { value: DateRange; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 365, label: '1y' },
];

export function DateRangeBar({ selectedRange, onRangeChange }: DateRangeBarProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-bg-secondary p-1">
      {RANGES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onRangeChange(value)}
          className={[
            'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
            'font-[family-name:var(--font-sans)]',
            selectedRange === value
              ? 'bg-accent-green/15 text-accent-green'
              : 'text-text-muted hover:text-text-secondary',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
