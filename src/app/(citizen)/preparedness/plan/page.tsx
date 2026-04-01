'use client';

import { motion } from 'framer-motion';
import { PlanWizard } from '@/components/preparedness/plan-wizard';

export default function EmergencyPlanPage() {
  return (
    <motion.div
      className="h-full pt-20 px-6 lg:px-12 pb-12 max-w-4xl mx-auto overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
          Emergency Plan Builder
        </h1>
        <p className="font-[family-name:var(--font-sans)] mt-1 text-sm text-text-muted">
          Create a personalized emergency plan for your household
        </p>
      </div>

      <PlanWizard />
    </motion.div>
  );
}
