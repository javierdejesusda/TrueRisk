'use client';

import { useEffect } from 'react';
import { NavPill } from '@/components/layout/nav-pill';
import { useAlertStream } from '@/hooks/use-alert-stream';
import { ToastContainer } from '@/components/ui/toast';
import { PushBanner } from '@/components/notifications/push-banner';
import { EmergencyBanner } from '@/components/emergency/emergency-banner';
import { OfflineIndicator } from '@/components/ui/offline-indicator';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAlertStream();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err);
      });
    }
  }, []);

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
