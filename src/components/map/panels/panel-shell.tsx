'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PanelShellProps {
  title: string;
  icon: ReactNode;
  position?: string;
  children: ReactNode;
  collapsedContent?: ReactNode;
  updatedAt?: Date;
}

export function PanelShell({
  title,
  icon,
  position,
  children,
  collapsedContent,
  updatedAt,
}: PanelShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [relativeTime, setRelativeTime] = useState<string | null>(null);

  useEffect(() => {
    if (!updatedAt) return;
    const compute = () => {
      const mins = Math.floor((Date.now() - updatedAt.getTime()) / 60000);
      if (mins < 1) setRelativeTime('Just now');
      else if (mins < 60) setRelativeTime(`${mins}m ago`);
      else setRelativeTime(`${Math.floor(mins / 60)}h ago`);
    };
    const id = requestAnimationFrame(compute);
    const interval = setInterval(compute, 60000);
    return () => { cancelAnimationFrame(id); clearInterval(interval); };
  }, [updatedAt]);

  return (
    <div className={position ? `absolute z-40 ${position}` : ''}>
      <div className="glass-heavy rounded-xl shadow-lg animate-panel-enter min-w-[200px] max-w-[280px]">
        {/* Header */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 w-full px-3 py-2.5 cursor-pointer"
        >
          <span className="text-text-secondary shrink-0">{icon}</span>
          <span className="text-xs font-medium text-text-primary flex-1 text-left">{title}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={`text-text-muted transition-transform duration-200 shrink-0 ${collapsed ? '-rotate-90' : 'rotate-0'}`}
          >
            <path d="M3 5l3 3 3-3" />
          </svg>
        </button>

        {/* Collapsed preview */}
        {collapsed && collapsedContent && (
          <div className="px-3 pb-2.5 -mt-1">
            {collapsedContent}
          </div>
        )}

        {/* Expanded body */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 border-t border-white/5 pt-2">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Updated timestamp */}
        {relativeTime && !collapsed && (
          <div className="px-3 pb-2 -mt-1">
            <span className="text-[9px] text-text-muted">Updated {relativeTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}
