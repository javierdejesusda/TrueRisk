'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavPill } from '@/components/layout/nav-pill';
import { useAlertStream } from '@/hooks/use-alert-stream';
import { useAuth } from '@/hooks/use-auth';
import { ToastContainer } from '@/components/ui/toast';
import { PushBanner } from '@/components/notifications/push-banner';
import { EmergencyBanner } from '@/components/emergency/emergency-banner';
import { OfflineIndicator } from '@/components/ui/offline-indicator';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  useAlertStream();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err);
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg-primary grain">
      <NavPill />
      <PushBanner />
      <EmergencyBanner />
      {children}
      <OfflineIndicator />
      <ToastContainer />
    </div>
  );
}
