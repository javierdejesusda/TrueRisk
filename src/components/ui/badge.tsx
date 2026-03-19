'use client';

import type { ReactNode } from 'react';

const variantStyles = {
  success: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  warning: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
  danger: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  info: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  neutral: 'bg-bg-card text-text-secondary border-border',
} as const;

const severityStyles: Record<number, string> = {
  1: 'bg-severity-1/15 text-severity-1 border-severity-1/30',
  2: 'bg-severity-2/15 text-severity-2 border-severity-2/30',
  3: 'bg-severity-3/15 text-severity-3 border-severity-3/30',
  4: 'bg-severity-4/15 text-severity-4 border-severity-4/30',
  5: 'bg-severity-5/15 text-severity-5 border-severity-5/30',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
} as const;

export type BadgeVariant = keyof typeof variantStyles;
export type BadgeSize = keyof typeof sizeStyles;

export interface BadgeProps {
  variant?: BadgeVariant;
  severity?: 1 | 2 | 3 | 4 | 5;
  size?: BadgeSize;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant,
  severity,
  size = 'md',
  pulse = false,
  children,
  className = '',
}: BadgeProps) {
  const colorStyle = severity
    ? severityStyles[severity]
    : variantStyles[variant ?? 'neutral'];

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap transition-transform duration-150 hover:scale-105',
        severity && 'font-mono',
        colorStyle,
        sizeStyles[size],
        pulse && 'animate-pulse',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
