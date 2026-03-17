'use client';

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PageTransitionProps {
  children: ReactNode;
  /** Pass the current route pathname so AnimatePresence can detect changes */
  transitionKey: string;
}

export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
