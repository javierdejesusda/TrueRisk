'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AddressSearch } from '@/components/property/address-search';

const featureIcons = [
  // Shield check
  <svg key="f1" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>,
  // Chart bar
  <svg key="f2" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>,
  // Map pin
  <svg key="f3" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>,
  // Document
  <svg key="f4" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>,
];

export default function ReportPage() {
  const t = useTranslations('PropertyReport');

  const features = [
    { title: t('feature1Title'), desc: t('feature1Desc') },
    { title: t('feature2Title'), desc: t('feature2Desc') },
    { title: t('feature3Title'), desc: t('feature3Desc') },
    { title: t('feature4Title'), desc: t('feature4Desc') },
  ];

  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] px-6 lg:px-12 pb-16 max-w-2xl mx-auto flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero */}
      <div className="pt-16 sm:pt-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold text-text-primary">
          {t('title')}
        </h1>
        <p className="font-[family-name:var(--font-sans)] mt-3 text-base text-text-secondary max-w-lg mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Address Search */}
      <div className="mt-10">
        <AddressSearch />
      </div>

      {/* Feature highlights */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            className="rounded-xl border border-border bg-bg-card p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.07 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-text-secondary shrink-0 mt-0.5">
                {featureIcons[i]}
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="font-[family-name:var(--font-sans)] mt-1 text-xs text-text-muted leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
