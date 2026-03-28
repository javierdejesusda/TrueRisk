'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

const variantStyles = {
  primary:
    'bg-white/[0.14] backdrop-blur-[24px] border border-white/[0.18] text-text-primary shadow-[0_2px_12px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/[0.24] hover:border-white/[0.35] hover:shadow-[0_8px_32px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5',
  danger:
    'bg-accent-red/[0.15] backdrop-blur-[24px] border border-accent-red/[0.25] text-red-300 shadow-[0_2px_12px_rgba(239,68,68,0.06)] hover:bg-accent-red/[0.28] hover:border-accent-red/[0.45] hover:shadow-[0_8px_32px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(239,68,68,0.1)] hover:-translate-y-0.5',
  ghost:
    'bg-transparent text-text-secondary border border-transparent hover:bg-white/[0.10] hover:text-text-primary hover:border-white/[0.12] hover:backdrop-blur-[20px] hover:shadow-[0_4px_20px_rgba(255,255,255,0.06)] hover:-translate-y-px',
  outline:
    'border border-white/[0.15] text-text-primary bg-transparent hover:bg-white/[0.12] hover:border-white/[0.30] hover:backdrop-blur-[20px] hover:shadow-[0_8px_28px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5',
  secondary:
    'bg-white/[0.06] backdrop-blur-[20px] border border-white/[0.08] text-text-secondary shadow-none hover:bg-white/[0.14] hover:text-text-primary hover:border-white/[0.20] hover:shadow-[0_6px_24px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-px',
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
          'inline-flex items-center justify-center font-medium transition-all duration-250 cursor-pointer',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green',
          'active:scale-[0.97]',
          'disabled:opacity-50 disabled:pointer-events-none',
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
