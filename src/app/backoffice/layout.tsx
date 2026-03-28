'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PageTransition } from '@/components/layout/page-transition';
import { useAlerts } from '@/hooks/use-alerts';

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const authUser = useAppStore((s) => s.authUser);
  const { hasActiveAlerts } = useAlerts();

  useEffect(() => {
    if (authUser && authUser.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [authUser, router]);

  if (!authUser || authUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="relative grain flex min-h-screen bg-bg-primary">
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
