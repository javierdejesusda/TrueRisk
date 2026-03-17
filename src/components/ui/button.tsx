'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

const variantStyles = {
  primary:
    'bg-accent-green text-bg-primary hover:brightness-110 active:brightness-90',
  danger:
    'bg-accent-red text-white hover:brightness-110 active:brightness-90',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-card hover:text-text-primary',
  outline:
    'bg-transparent border border-border text-text-primary hover:border-border-hover hover:bg-bg-card',
  secondary:
    'bg-bg-card text-text-secondary hover:bg-bg-card-hover hover:text-text-primary',
} as const;

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
} as const;

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green',
          'active:scale-[0.97] hover:scale-[1.02]',
          'disabled:opacity-50 disabled:pointer-events-none',
          'cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
