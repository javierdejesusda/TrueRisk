'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PageTransition } from '@/components/layout/page-transition';
import { useAuth } from '@/hooks/use-auth';
import { useAlerts } from '@/hooks/use-alerts';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { hasActiveAlerts } = useAlerts();

  // Auth guard: redirect non-backoffice users
  useEffect(() => {
    if (!isLoading && user && user.role !== 'backoffice') {
      router.replace('/citizen');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Skeleton width="48px" height="48px" rounded="full" />
          <Skeleton width="160px" height="16px" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useAuth will handle redirect to /login
  }

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar role="backoffice" />

      <div className="flex flex-1 flex-col">
        <Header user={user} hasActiveAlerts={hasActiveAlerts} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageTransition transitionKey={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
