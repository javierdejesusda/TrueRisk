'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/10">
          {icon}
        </div>
      )}
      <p className="font-[family-name:var(--font-display)] text-lg text-accent-green">{title}</p>
      {description && (
        <p className="font-[family-name:var(--font-sans)] text-xs text-text-muted text-center max-w-sm">{description}</p>
      )}
      {action && (
        <Link href={action.href}>
          <Button variant="outline" size="sm">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}
