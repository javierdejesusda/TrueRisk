'use client';

import type { ReactNode } from 'react';

export interface CardProps {
  className?: string;
  children: ReactNode;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'glass-heavy';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
} as const;

const variantStyles = {
  default: 'border border-border bg-bg-card',
  glass: 'glass',
  'glass-heavy': 'glass-heavy',
} as const;

export function Card({
  className = '',
  children,
  hoverable = false,
  padding = 'md',
  variant = 'default',
}: CardProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl',
        variantStyles[variant],
        paddingStyles[padding],
        hoverable &&
          'transition-all duration-200 hover:border-accent-green/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.04)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
