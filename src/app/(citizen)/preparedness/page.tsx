'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePreparedness } from '@/hooks/use-preparedness';
import { ScoreGauge } from '@/components/preparedness/score-gauge';
import { ScoreTrend } from '@/components/preparedness/score-trend';
import { CategoryCard } from '@/components/preparedness/category-card';

const CATEGORY_CTAS: Record<string, { label: string; label_es: string; href: string }> = {
  plan: { label: 'Build your plan', label_es: 'Crear tu plan', href: '/preparedness/plan' },
  alerts: { label: 'Configure alerts', label_es: 'Configurar alertas', href: '/profile' },
};

export default function PreparednessPage() {
  const t = useTranslations('Preparedness');
  const { score, checklist, history, isLoading, toggleItem } = usePreparedness();

  const categories = score?.categories ?? [];

  return (
    <motion.div
      className="h-screen pt-20 px-6 lg:px-12 pb-12 max-w-4xl mx-auto overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
          {t('title')}
        </h1>
        <p className="font-[family-name:var(--font-sans)] mt-1 text-sm text-text-muted">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ScoreGauge
          score={score?.total_score ?? 0}
          isLoading={isLoading}
          label={t('scoreLabel')}
        />
        <ScoreTrend
          history={history}
          label={t('trendLabel')}
        />
      </div>

      <div className="flex flex-col gap-3">
        {categories.map((cat) => {
          const items = checklist?.categories[cat.category] ?? [];
          const cta = CATEGORY_CTAS[cat.category];

          return (
            <CategoryCard
              key={cat.category}
              category={cat.category}
              label={cat.label}
              totalItems={cat.total_items}
              completedItems={cat.completed_items}
              score={cat.score}
              items={items}
              onToggle={toggleItem}
              cta={cta ? { label: cta.label, href: cta.href } : undefined}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
