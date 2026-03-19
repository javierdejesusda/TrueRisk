'use client';

export function QuickCall({ floating = false }: { floating?: boolean }) {
  if (floating) {
    return (
      <a
        href="tel:112"
        aria-label="Llamar al 112 - Emergencias"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold rounded-full transition-all shadow-lg shadow-red-900/30 h-16 w-16 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-[glow-pulse_2s_infinite]"
        style={{ '--glow-color': 'rgba(239, 68, 68, 0.3)' } as React.CSSProperties}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </a>
    );
  }

  return (
    <a
      href="tel:112"
      aria-label="Llamar al 112 - Emergencias"
      className="flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold rounded-full transition-colors shadow-lg shadow-red-900/30 h-12 w-12 text-base"
    >
      <span className="font-[family-name:var(--font-mono)] font-bold text-sm">112</span>
    </a>
  );
}
