'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, type ChatMessage } from '@/store/chat-store';
import { Bot, User } from 'lucide-react';

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-accent-blue/60"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

function MessageBubble({ message, isLast }: { message: ChatMessage; isLast: boolean }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 mt-0.5 ${isUser ? 'hidden sm:flex' : 'flex'}`}>
        {isUser ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] border border-border/30">
            <User className="h-3.5 w-3.5 text-text-muted" />
          </div>
        ) : (
          <div className="relative">
            {isLast && !message.content && (
              <div className="absolute -inset-1 rounded-lg bg-accent-blue/10 blur-sm animate-pulse" />
            )}
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/10 border border-white/[0.06]">
              <Bot className="h-3.5 w-3.5 text-text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] sm:max-w-[75%] ${isUser ? 'text-right' : 'text-left'}`}
      >
        <div
          className={[
            'inline-block px-4 py-2.5 text-left',
            isUser
              ? 'bg-white/[0.07] rounded-2xl rounded-tr-md border border-white/[0.04]'
              : 'bg-bg-card/80 rounded-2xl rounded-tl-md border border-border/20',
          ].join(' ')}
        >
          {message.content ? (
            <p
              className={[
                'font-[family-name:var(--font-sans)] text-[13px] leading-[1.75] whitespace-pre-wrap break-words',
                isUser ? 'text-text-primary' : 'text-text-secondary',
              ].join(' ')}
            >
              {message.content}
            </p>
          ) : (
            <StreamingDots />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  const t = useTranslations('Chat');

  const suggestions = [
    { icon: '🌊', text: 'Flood risk analysis' },
    { icon: '🔥', text: 'Wildfire preparedness' },
    { icon: '🌡️', text: 'Heatwave safety tips' },
    { icon: '🏠', text: 'Building vulnerability' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {/* Central glow */}
      <div className="relative mb-8">
        <div className="absolute -inset-12 rounded-full bg-accent-blue/[0.04] blur-3xl" />
        <div className="absolute -inset-6 rounded-full bg-accent-purple/[0.03] blur-2xl" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/15 to-accent-purple/10 border border-white/[0.06]"
          style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.08), inset 0 1px 0 rgba(255,255,255,0.04)' }}
        >
          <Bot className="h-7 w-7 text-text-primary/80" />
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary tracking-[-0.02em] mb-2"
      >
        {t('title')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="font-[family-name:var(--font-sans)] text-sm text-text-muted max-w-sm text-center leading-relaxed mb-8"
      >
        {t('emptyState')}
      </motion.p>

      {/* Suggestion chips */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex flex-wrap gap-2 justify-center max-w-md"
      >
        {suggestions.map((s, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-border/30 font-[family-name:var(--font-sans)] text-[11px] text-text-muted/70"
          >
            <span>{s.icon}</span>
            {s.text}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

function ErrorPill({ message }: { message: string }) {
  const t = useTranslations('Chat');

  const errorMap: Record<string, string> = {
    injection_detected: t('error_injection_detected'),
    daily_message_limit: t('error_daily_limit'),
    hourly_message_limit: t('error_hourly_limit'),
    daily_token_limit: t('error_daily_token_budget'),
    monthly_token_limit: t('error_monthly_token_budget'),
    cooldown: t('error_cooldown'),
    conversation_limit: t('error_conversation_limit'),
    platform_disabled: t('error_platform_disabled'),
    ai_error: t('error_stream_error'),
    stream_error: t('error_stream_error'),
  };

  const errorCode = message.split('|')[0];
  const displayMessage = errorMap[errorCode] ?? t('errorGeneric');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex justify-center py-2"
    >
      <span className="inline-flex items-center gap-2 rounded-xl bg-accent-red/[0.06] border border-accent-red/15 px-4 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-red/80" />
        <span className="font-[family-name:var(--font-sans)] text-xs text-accent-red/90">
          {displayMessage}
        </span>
      </span>
    </motion.div>
  );
}

export function ChatMessages() {
  const messages = useChatStore((s) => s.messages);
  const error = useChatStore((s) => s.error);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, error]);

  if (messages.length === 0 && !error) {
    return <EmptyState />;
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto px-2 py-4 space-y-4 scrollbar-thin"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
          />
        ))}
      </AnimatePresence>
      {error && <ErrorPill message={error} />}
    </div>
  );
}
