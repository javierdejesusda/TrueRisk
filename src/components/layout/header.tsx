'use client';

import { Badge } from '@/components/ui/badge';

export interface HeaderUser {
  nickname: string;
  role: 'citizen' | 'backoffice';
}

export interface HeaderProps {
  user: HeaderUser;
  hasActiveAlerts?: boolean;
}

export function Header({ user, hasActiveAlerts = false }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-bg-secondary px-4 lg:px-6">
      {/* Left spacer for mobile hamburger clearance */}
      <div className="w-10 lg:w-0" />

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-3">
        {/* Active alert indicator */}
        {hasActiveAlerts && (
          <div className="flex items-center gap-2 text-sm text-accent-red">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-red" />
            </span>
            <span className="hidden sm:inline">Active alerts</span>
          </div>
        )}

        {/* User info */}
        <div className="flex items-center gap-2.5">
          {/* Avatar placeholder */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card text-sm font-medium text-text-secondary">
            {user.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-medium text-text-primary leading-tight">
              {user.nickname}
            </span>
            <Badge
              variant={user.role === 'backoffice' ? 'info' : 'neutral'}
              size="sm"
            >
              {user.role}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
