'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PageTransition } from '@/components/layout/page-transition';
import { useAuth } from '@/hooks/use-auth';
import { useAlerts } from '@/hooks/use-alerts';
import { useAlertStream } from '@/hooks/use-alert-stream';
import { ToastContainer } from '@/components/ui/toast';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const { hasActiveAlerts } = useAlerts();

  // Subscribe to real-time alert stream via SSE
  useAlertStream();

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent-primary" />
          <span className="text-sm text-text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar role="citizen" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} hasActiveAlerts={hasActiveAlerts} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageTransition transitionKey={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
