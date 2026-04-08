'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { NavPill } from '@/components/layout/nav-pill';
import { useAlertStream } from '@/hooks/use-alert-stream';
import { useAuth } from '@/hooks/use-auth';
import { ToastContainer } from '@/components/ui/toast';
import { PushBanner } from '@/components/notifications/push-banner';
import { EmergencyBanner } from '@/components/emergency/emergency-banner';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { useOfflinePack } from '@/hooks/use-offline-pack';
import { useAppStore } from '@/store/app-store';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { Walkthrough } from '@/components/ui/walkthrough';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const authUser = useAppStore((s) => s.authUser);
  const provinceCode = useAppStore((s) => s.provinceCode);
  const [timedOut, setTimedOut] = useState(false);
  useAlertStream();
  useOfflinePack(); // Auto-syncs on mount and every 30min

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if ((!isLoading || timedOut) && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, timedOut, router]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err);
      });
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      Sentry.setUser({ id: String(authUser.id) });
      Sentry.setTag('user_role', authUser.role);
    } else {
      Sentry.setUser(null);
    }
  }, [authUser]);

  useEffect(() => {
    if (provinceCode) {
      Sentry.setTag('province_code', provinceCode);
    }
  }, [provinceCode]);

  if (isLoading && !timedOut) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!hasSeenOnboarding) {
    return (
      <div className="relative h-dvh w-screen overflow-hidden bg-bg-primary grain">
        <OnboardingFlow />
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-bg-primary grain">
      <NavPill />
      <PushBanner />
      <EmergencyBanner />
      {children}
      <Walkthrough />
      <OfflineIndicator />
      <ToastContainer />
    </div>
  );
}
