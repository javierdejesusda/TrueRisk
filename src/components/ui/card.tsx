'use client';

import type { ReactNode } from 'react';

export interface CardProps {
  className?: string;
  children: ReactNode;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
} as const;

export function Card({
  className = '',
  children,
  hoverable = false,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-border bg-bg-card',
        paddingStyles[padding],
        hoverable &&
          'transition-all duration-200 hover:border-border-hover hover:bg-bg-card-hover hover:shadow-[0_0_20px_rgba(52,211,153,0.06)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
