'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Lightbulb, Send } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);
  const [thinkMode, setThinkMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isStreaming = useChatStore((s) => s.isStreaming);
  const canSend = useChatStore((s) => s.usage?.canSend ?? true);
  const { sendMessage } = useChat();

  const isEmpty = value.trim().length === 0;
  const isDisabled = isEmpty || isStreaming || !canSend;

  // --- Animated placeholder ---
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isFocused || value.length > 0) return;

    const target = placeholders[placeholderIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayedPlaceholder.length < target.length) {
        timer = setTimeout(() => {
          setDisplayedPlaceholder(target.slice(0, displayedPlaceholder.length + 1));
        }, 30);
      } else {
        timer = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (displayedPlaceholder.length > 0) {
        timer = setTimeout(() => {
          setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1));
        }, 20);
      } else {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedPlaceholder, isDeleting, isFocused, value, placeholderIndex, placeholders]);

  // Reset placeholder animation when focus leaves
  useEffect(() => {
    if (!isFocused && value.length === 0) {
      setDisplayedPlaceholder('');
      setIsDeleting(false);
    }
  }, [isFocused, value]);

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
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="border-t border-border/30 p-3">
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-border/30 bg-bg-card"
        animate={{
          height: isFocused ? 128 : 68,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {/* Input row */}
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={MAX_CHARS}
              disabled={isStreaming || !canSend}
              className={[
                'w-full bg-transparent',
                'font-[family-name:var(--font-sans)] text-sm text-text-primary leading-[1.6]',
                'placeholder:text-transparent',
                'focus:outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              ].join(' ')}
              aria-label={t('inputPlaceholder')}
            />
            {/* Animated placeholder overlay */}
            {value.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center">
                <AnimatePresence mode="wait">
                  {displayedPlaceholder.split('').map((char, i) => (
                    <motion.span
                      key={`${placeholderIndex}-${i}`}
                      initial={{ opacity: 0, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(4px)' }}
                      transition={{ duration: 0.08, delay: i * 0.01 }}
                      className="inline-block font-[family-name:var(--font-sans)] text-sm text-text-muted/60"
                      style={{ whiteSpace: 'pre' }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isDisabled}
            aria-label={t('send')}
            className={[
              'flex-shrink-0 flex items-center justify-center',
              'h-9 w-9 rounded-xl',
              'bg-text-primary text-bg-primary',
              'transition-[transform,opacity] duration-150',
              'hover:scale-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-muted/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card',
              'active:scale-95',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
            ].join(' ')}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Bottom row: Think button + character counter (visible when expanded) */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between px-4 pb-3"
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setThinkMode((prev) => !prev)}
                className={[
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-muted/40',
                  thinkMode
                    ? 'bg-accent-blue/10 border border-accent-blue/40 text-accent-blue'
                    : 'bg-white/[0.06] text-text-secondary hover:bg-white/[0.1]',
                ].join(' ')}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {t('thinking').replace('...', '')}
              </button>

              <span
                className={[
                  'font-[family-name:var(--font-mono)] text-[10px] select-none',
                  value.length > WARN_THRESHOLD ? 'text-accent-red' : 'text-text-muted/50',
                ].join(' ')}
              >
                {value.length}/{MAX_CHARS}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
