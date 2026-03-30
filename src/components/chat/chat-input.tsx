'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useChatStore } from '@/store/chat-store';
import { useChat } from '@/hooks/use-chat';

const MAX_CHARS = 500;
const WARN_THRESHOLD = 450;

const PLACEHOLDERS_EN = [
  "What's the flood risk in my area?",
  'How should I prepare for a heatwave?',
  'Explain the current weather alerts',
  'What emergency supplies do I need?',
  'Is my building safe in an earthquake?',
  'Tell me about drought conditions',
];

const PLACEHOLDERS_ES = [
  'Cual es el riesgo de inundacion en mi zona?',
  'Como debo prepararme para una ola de calor?',
  'Explicame las alertas meteorologicas actuales',
  'Que suministros de emergencia necesito?',
  'Es seguro mi edificio en un terremoto?',
  'Cuentame sobre las condiciones de sequia',
];

export function ChatInput() {
  const t = useTranslations('Chat');
  const locale = useLocale();
  const placeholders = locale === 'es' ? PLACEHOLDERS_ES : PLACEHOLDERS_EN;

  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isStreaming = useChatStore((s) => s.isStreaming);
  const { sendMessage } = useChat();

  const isEmpty = value.trim().length === 0;
  const isDisabled = isEmpty || isStreaming;

  // Cycle placeholder text
  useEffect(() => {
    if (value.length > 0) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      const timer = setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setShowPlaceholder(true);
      }, 400);
      return () => clearTimeout(timer);
    }, 3500);

    return () => clearInterval(interval);
  }, [value, placeholders.length]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (next.length <= MAX_CHARS) {
      setValue(next);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (isDisabled) return;
    const msg = value.trim();
    setValue('');
    sendMessage(msg);
  }, [isDisabled, value, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.02 } },
    exit: { transition: { staggerChildren: 0.01, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: { opacity: 0, filter: 'blur(8px)', y: 6 },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: 'spring' as const, stiffness: 100, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: 'blur(8px)',
      y: -6,
      transition: {
        opacity: { duration: 0.15 },
        filter: { duration: 0.2 },
      },
    },
  };

  return (
    <div ref={wrapperRef}>
      <div
        className="flex items-center gap-2 rounded-full bg-bg-card border border-border/30 px-2 py-1.5 transition-all duration-200 focus-within:border-border-hover/60"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}
      >
        {/* Input + placeholder */}
        <div className="relative flex-1 ml-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CHARS}
            disabled={isStreaming}
            className="w-full bg-transparent font-[family-name:var(--font-sans)] text-sm text-text-primary leading-[1.6] placeholder:text-transparent outline-none focus:outline-none focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ outline: 'none' }}
            aria-label={t('inputPlaceholder')}
          />
          {/* Animated placeholder */}
          {value.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
              <AnimatePresence mode="wait">
                {showPlaceholder && (
                  <motion.span
                    key={placeholderIndex}
                    className="absolute whitespace-nowrap"
                    variants={placeholderContainerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {placeholders[placeholderIndex].split('').map((char, i) => (
                      <motion.span
                        key={i}
                        variants={letterVariants}
                        className="inline-block font-[family-name:var(--font-sans)] text-sm text-text-muted/40"
                        style={{ whiteSpace: 'pre' }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Character counter (only when typing) */}
        {value.length > 0 && (
          <span
            className={[
              'font-[family-name:var(--font-mono)] text-[10px] select-none tabular-nums',
              value.length > WARN_THRESHOLD ? 'text-accent-red' : 'text-text-muted/30',
            ].join(' ')}
          >
            {value.length}/{MAX_CHARS}
          </span>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isDisabled}
          aria-label={t('send')}
          className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-text-primary text-bg-primary transition-[transform,opacity] duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
