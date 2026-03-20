'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

const features = [
  {
    key: 'monitoring',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0" />
        <path d="M12 12l4-3" />
        <path d="M12 12v-4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: 'mlModels',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h.01" />
        <path d="M15 9h.01" />
        <path d="M9 15h.01" />
        <path d="M15 15h.01" />
        <path d="M9 9l6 6" />
        <path d="M15 9l-6 6" />
      </svg>
    ),
  },
  {
    key: 'emergency',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
      </svg>
    ),
  },
  {
    key: 'community',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
] as const;

export function FeatureHighlights() {
  const t = useTranslations('Landing');

  return (
    <section
      id="features"
      className="relative w-full px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            {t('featuresTitle')}
          </h2>
          <p className="mt-3 text-base text-text-secondary">
            {t('featuresSubtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
            >
              <Card variant="glass" hoverable padding="lg" className="h-full">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green">
                  {feature.icon}
                </div>
                <h3 className="font-[family-name:var(--font-sans)] text-base font-semibold text-text-primary">
                  {t(`${feature.key}Title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`${feature.key}Desc`)}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
