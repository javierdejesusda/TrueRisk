'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { PHRASES, SPEECH_LANG_MAP } from '@/lib/constants/emergency-phrases';
import type { Phrase } from '@/lib/constants/emergency-phrases';

interface PhraseBookProps {
  category: string;
  targetLang: string;
}

export function PhraseBook({ category, targetLang }: PhraseBookProps) {
  const t = useTranslations('Phrases');
  const phrases: Phrase[] = PHRASES[category] || [];
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);

  const speak = useCallback(
    (text: string, lang: string, phraseKey: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = SPEECH_LANG_MAP[lang] || lang;
      utterance.rate = 0.85;
      utterance.pitch = 1;

      setSpeakingKey(phraseKey);
      utterance.onend = () => setSpeakingKey(null);
      utterance.onerror = () => setSpeakingKey(null);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={category}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="space-y-3"
      >
        {phrases.map((phrase) => {
          const esText = phrase.translations.es || '';
          const targetText = phrase.translations[targetLang] || '';
          const isSpeaking = speakingKey === phrase.key;

          return (
            <div
              key={phrase.key}
              className="glass rounded-2xl p-4 space-y-2 border border-white/[0.06] hover:border-white/10 transition-colors"
            >
              {/* Spanish text (source) */}
              <p className="font-[family-name:var(--font-sans)] text-xs text-text-muted leading-relaxed">
                {esText}
              </p>

              {/* Target language text */}
              <p
                className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary leading-snug"
                dir={targetLang === 'ar' ? 'rtl' : 'ltr'}
              >
                {targetText}
              </p>

              {/* Speak button */}
              <button
                type="button"
                onClick={() => speak(targetText, targetLang, phrase.key)}
                disabled={isSpeaking}
                className={[
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
                  isSpeaking
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-white/[0.06] text-text-secondary hover:bg-white/10 hover:text-text-primary',
                ].join(' ')}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isSpeaking ? 'animate-pulse' : ''}
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                {isSpeaking ? '...' : t('speak')}
              </button>
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
