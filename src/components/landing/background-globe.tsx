'use client';

import dynamic from 'next/dynamic';

const RotatingEarth = dynamic(
  () => import('@/components/globe/rotating-earth').then((m) => ({ default: m.RotatingEarth })),
  { ssr: false },
);

export function BackgroundGlobe() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <RotatingEarth className="h-full w-full" />
    </div>
  );
}
