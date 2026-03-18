'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PageTransition } from '@/components/layout/page-transition';
import { useAlerts } from '@/hooks/use-alerts';
import { useAlertStream } from '@/hooks/use-alert-stream';
import { ToastContainer } from '@/components/ui/toast';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { hasActiveAlerts } = useAlerts();
  useAlertStream();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header hasActiveAlerts={hasActiveAlerts} />
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
