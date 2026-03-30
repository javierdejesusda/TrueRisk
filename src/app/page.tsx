'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const RotatingEarth = dynamic(
  () => import('@/components/globe/rotating-earth').then((m) => ({ default: m.RotatingEarth })),
  { ssr: false },
);

export default function Home() {
  const t = useTranslations('Home');
  const [introComplete, setIntroComplete] = useState(false);
  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-bg-primary">
      <div className="relative flex h-screen flex-col items-center justify-center px-4">
        {/* Globe background — fills entire viewport */}
        <div className="pointer-events-none absolute inset-0">
          <RotatingEarth className="h-full w-full" onIntroComplete={handleIntroComplete} />
        </div>

        {introComplete && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7, ease: 'easeOut' }}
              className="font-[family-name:var(--font-display)] text-6xl font-extrabold tracking-tighter text-text-primary sm:text-7xl lg:text-8xl"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.9)' }}
            >
              True
              <span
                className="text-accent-green"
              >
                Risk
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-4 max-w-lg font-[family-name:var(--font-sans)] text-lg font-light text-text-primary sm:text-xl"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.9)' }}
            >
              {t('subtitle')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-2 max-w-md text-sm text-text-primary/80"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.9)' }}
            >
              {t('description')}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/map"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-accent-green px-10 text-base font-semibold text-bg-primary transition-all hover:brightness-110 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-[0.97]"
              >
                {t('enterButton')}
                <span className="inline-block transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
