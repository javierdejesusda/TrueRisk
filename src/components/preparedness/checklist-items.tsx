'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChecklistItem } from '@/hooks/use-preparedness';

interface ChecklistItemsProps {
  items: ChecklistItem[];
  onToggle: (itemKey: string, completed: boolean) => void;
}

export function ChecklistItems({ items, onToggle }: ChecklistItemsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => (
        <motion.label
          key={item.item_key}
          className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group"
          layout
        >
          <button
            type="button"
            onClick={() => onToggle(item.item_key, !item.completed)}
            className={[
              'mt-0.5 flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 shrink-0 cursor-pointer',
              item.completed
                ? 'bg-accent-green border-accent-green'
                : 'border-white/20 group-hover:border-white/40',
            ].join(' ')}
          >
            {item.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Check className="w-3 h-3 text-black" />
              </motion.div>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={[
                  'text-sm transition-colors duration-200',
                  item.completed ? 'text-text-muted line-through' : 'text-text-primary',
                ].join(' ')}
              >
                {item.label}
              </span>
              {item.priority === 'high' && !item.completed && (
                <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                  !
                </Badge>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              {item.description}
            </p>
          </div>
        </motion.label>
      ))}
    </div>
  );
}
