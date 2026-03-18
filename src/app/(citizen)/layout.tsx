'use client';

import { NavPill } from '@/components/layout/nav-pill';
import { useAlertStream } from '@/hooks/use-alert-stream';
import { ToastContainer } from '@/components/ui/toast';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAlertStream();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg-primary">
      <NavPill />
      {children}
      <ToastContainer />
    </div>
  );
}
