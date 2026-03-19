'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold uppercase tracking-wider text-text-secondary font-[family-name:var(--font-display)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-muted',
            'transition-all duration-150',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-accent-red focus:border-accent-red/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
              : 'border-border hover:border-border-hover focus:border-accent-green/60 focus:shadow-[0_0_0_3px_rgba(34,245,140,0.1)]',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <p className="text-xs text-accent-red">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
