'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useChatStore, type ChatMessage } from '@/store/chat-store';

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-text-muted/60"
          style={{
            animation: 'chat-dot-pulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes chat-dot-pulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </span>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] px-4 py-2.5',
          isUser
            ? 'bg-white/[0.08] rounded-2xl rounded-br-sm'
            : 'bg-bg-card rounded-2xl rounded-bl-sm border border-border/30',
        ].join(' ')}
      >
        {message.content ? (
          <p
            className={[
              'font-[family-name:var(--font-sans)] text-sm leading-[1.7] whitespace-pre-wrap break-words',
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
  );
}

function EmptyState() {
  const t = useTranslations('Chat');

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-border/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-6 w-6 text-text-muted/60"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>
      </div>
      <p className="font-[family-name:var(--font-sans)] text-sm text-text-muted leading-[1.7]">
        {t('emptyState')}
      </p>
    </div>
  );
}

function ErrorPill({ message }: { message: string }) {
  const t = useTranslations('Chat');

  // Map known error codes to i18n keys, fall back to raw message
  const displayMessage = (() => {
    const errorMap: Record<string, string> = {
      rate_limited: t('errorRateLimited'),
      token_limit: t('errorTokenLimit'),
      connection_failed: t('errorConnection'),
    };
    return errorMap[message] ?? message;
  })();

  return (
    <div className="flex justify-center py-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-red/10 border border-accent-red/20 px-3 py-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5 text-accent-red"
        >
          <path
            fillRule="evenodd"
            d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-[family-name:var(--font-sans)] text-xs text-accent-red">
          {displayMessage}
        </span>
      </span>
    </div>
  );
}

export function ChatMessages() {
  const messages = useChatStore((s) => s.messages);
  const error = useChatStore((s) => s.error);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, error]);

  if (messages.length === 0 && !error) {
    return <EmptyState />;
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin"
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {error && <ErrorPill message={error} />}
    </div>
  );
}
