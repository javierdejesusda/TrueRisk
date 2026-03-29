'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { staggerItem } from './shared';

interface ModelCardProps {
  title: string;
  subtitle: string;
  methodology: string;
  confidence?: number;
  badge?: { label: string; variant: 'info' | 'success' | 'warning' | 'danger' | 'neutral' };
  className?: string;
  index: number;
  children: ReactNode;
}

function confidenceDotColor(c: number): string {
  if (c >= 0.8) return 'bg-accent-red';
  if (c >= 0.6) return 'bg-accent-orange';
  if (c >= 0.4) return 'bg-accent-yellow';
  return 'bg-accent-green';
}

export function ModelCard({
  title,
  subtitle,
  methodology,
  confidence,
  badge,
  className = '',
  index,
  children,
}: ModelCardProps) {
  const t = useTranslations('StatisticalModels');
  const [methodOpen, setMethodOpen] = useState(true);

  return (
    <motion.div
      className={className}
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      <Card variant="glass" className="hover:border-accent-green/15 transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-text-secondary">{title}</h3>
            {confidence != null && (
              <span className={`h-2 w-2 rounded-full ${confidenceDotColor(confidence)}`} />
            )}
          </div>
          {badge && (
            <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
          )}
        </div>
        <p className="font-[family-name:var(--font-sans)] text-[10px] text-text-muted uppercase tracking-wider mb-3">{subtitle}</p>

        {/* How this works */}
        <button
          onClick={() => setMethodOpen((o) => !o)}
          className="flex items-center gap-1 font-[family-name:var(--font-sans)] text-[10px] text-text-muted hover:text-text-secondary transition-colors mb-3 cursor-pointer"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={`transition-transform duration-200 ${methodOpen ? 'rotate-90' : ''}`}
          >
            <path d="M4 3l3 3-3 3" />
          </svg>
          {t('methodology')}
        </button>
        <AnimatePresence>
          {methodOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-muted leading-relaxed mb-4 border-l-2 border-accent-green/30 pl-3">
                {methodology}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart content */}
        {children}
      </Card>
    </motion.div>
  );
}
