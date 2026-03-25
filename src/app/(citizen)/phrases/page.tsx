'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { LANGUAGES, CATEGORIES } from '@/lib/constants/emergency-phrases';
import { PhraseBook } from '@/components/emergency/phrase-book';

/** Inline SVG icons matching Lucide style, keyed by category icon name */
function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  switch (name) {
    case 'heart-pulse':
      return (
        <svg {...props}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
        </svg>
      );
    case 'alert-triangle':
      return (
        <svg {...props}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'map-pin':
      return (
        <svg {...props}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'car':
      return (
        <svg {...props}>
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case 'message-circle':
      return (
        <svg {...props}>
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function PhrasesPage() {
  const t = useTranslations('Phrases');
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedCategory, setSelectedCategory] = useState('medical');

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <motion.div
        className="mx-auto max-w-2xl px-4 py-20 pb-24 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Header */}
        <section className="space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-text-primary">
            {t('title')}
          </h1>
          <p className="font-[family-name:var(--font-sans)] text-sm text-text-secondary leading-relaxed">
            {t('subtitle')}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-green/10 border border-accent-green/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-green" />
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-accent-green">
              {t('offlineReady')}
            </span>
          </div>
        </section>

        {/* Language selector */}
        <section className="space-y-2">
          <label className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
            {t('selectLanguage')}
          </label>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                className={[
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer',
                  selectedLang === lang.code
                    ? 'glass-heavy bg-accent-green/15 text-accent-green border border-accent-green/30'
                    : 'glass text-text-secondary hover:text-text-primary hover:bg-white/10 border border-white/[0.06]',
                ].join(' ')}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="font-[family-name:var(--font-sans)]">{lang.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Category tabs */}
        <section className="space-y-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={[
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer',
                  selectedCategory === cat.key
                    ? 'bg-white/10 text-text-primary border border-white/15'
                    : 'text-text-muted hover:text-text-secondary hover:bg-white/5 border border-transparent',
                ].join(' ')}
              >
                <CategoryIcon name={cat.icon} />
                <span className="font-[family-name:var(--font-sans)]">
                  {t(cat.key)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Hint */}
        <p className="font-[family-name:var(--font-sans)] text-[11px] text-text-muted">
          {t('tapToSpeak')}
        </p>

        {/* Phrase list */}
        <PhraseBook category={selectedCategory} targetLang={selectedLang} />
      </motion.div>
    </div>
  );
}
