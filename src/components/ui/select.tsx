'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            'w-full appearance-none rounded-lg border bg-bg-secondary px-3 py-2 pr-8 text-sm text-text-primary',
            'transition-all duration-150',
            'focus:outline-none',
            'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-accent-red focus:border-accent-red/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
              : 'border-border hover:border-border-hover focus:border-accent-green/60 focus:shadow-[0_0_0_3px_rgba(34,245,140,0.1)]',
            className,
          ].join(' ')}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%233E3E52' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 6l3.5 4 3.5-4z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-accent-red">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export { Select };
