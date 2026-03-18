'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PageTransition } from '@/components/layout/page-transition';
import { useAlerts } from '@/hooks/use-alerts';

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { hasActiveAlerts } = useAlerts();

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header hasActiveAlerts={hasActiveAlerts} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageTransition transitionKey={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
