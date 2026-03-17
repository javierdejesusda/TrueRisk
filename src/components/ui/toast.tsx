'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface ToastItem {
  id: string;
  title: string;
  severity: number;
  description?: string;
}

const severityColors: Record<number, { bg: string; border: string; icon: string }> = {
  1: { bg: 'bg-severity-1/10', border: 'border-severity-1/40', icon: 'text-severity-1' },
  2: { bg: 'bg-severity-2/10', border: 'border-severity-2/40', icon: 'text-severity-2' },
  3: { bg: 'bg-severity-3/10', border: 'border-severity-3/40', icon: 'text-severity-3' },
  4: { bg: 'bg-severity-4/10', border: 'border-severity-4/40', icon: 'text-severity-4' },
  5: { bg: 'bg-severity-5/10', border: 'border-severity-5/40', icon: 'text-severity-5' },
};

const severityLabels: Record<number, string> = {
  1: 'Low',
  2: 'Moderate',
  3: 'High',
  4: 'Severe',
  5: 'Critical',
};

// ── Singleton toast state ────────────────────────────────────────────────

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const fn of listeners) fn([...toasts]);
}

export function showToast(item: Omit<ToastItem, 'id'>) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  toasts = [{ ...item, id }, ...toasts].slice(0, 5);
  notify();

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 5_000);
}

// ── Toast container component ────────────────────────────────────────────

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, []);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      <AnimatePresence mode="popLayout">
        {items.map((item) => {
          const colors = severityColors[item.severity] ?? severityColors[1];
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border ${colors.border} ${colors.bg} p-3 shadow-lg backdrop-blur-sm cursor-pointer`}
              onClick={() => dismiss(item.id)}
            >
              {/* Severity indicator dot */}
              <div className="mt-0.5 flex-shrink-0">
                <span className="relative flex h-3 w-3">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colors.icon} bg-current opacity-40`} />
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${colors.icon} bg-current`} />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary truncate">
                    {item.title}
                  </span>
                  <span className={`text-xs font-medium ${colors.icon}`}>
                    {severityLabels[item.severity] ?? `Lv ${item.severity}`}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
