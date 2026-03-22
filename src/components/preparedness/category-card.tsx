'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Package, Map, Bell, Users, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ChecklistItems } from './checklist-items';
import type { ChecklistItem } from '@/hooks/use-preparedness';

const CATEGORY_ICONS: Record<string, typeof Package> = {
  kit: Package,
  plan: Map,
  alerts: Bell,
  community: Users,
  knowledge: BookOpen,
};

interface CategoryCardProps {
  category: string;
  label: string;
  totalItems: number;
  completedItems: number;
  score: number;
  items: ChecklistItem[];
  onToggle: (itemKey: string, completed: boolean) => void;
  cta?: { label: string; href: string };
}

export function CategoryCard({
  category,
  label,
  totalItems,
  completedItems,
  score,
  items,
  onToggle,
  cta,
}: CategoryCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = CATEGORY_ICONS[category] ?? Package;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <Card variant="glass" padding="none">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-green/10 shrink-0">
          <Icon className="w-4 h-4 text-accent-green" />
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{label}</span>
            <span className="text-xs text-text-muted">
              {completedItems}/{totalItems}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                background: percentage === 100
                  ? '#22c55e'
                  : percentage >= 50
                    ? '#f59e0b'
                    : '#ef4444',
              }}
            />
          </div>
        </div>

        <span className="text-xs font-bold text-text-muted tabular-nums w-10 text-right">
          {Math.round(score)}%
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-3">
              <ChecklistItems items={items} onToggle={onToggle} />
              {cta && (
                <a
                  href={cta.href}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-green hover:text-accent-green/80 transition-colors"
                >
                  {cta.label} →
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
