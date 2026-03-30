'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useChatStore } from '@/store/chat-store';
import { useChat } from '@/hooks/use-chat';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatUsageBar } from '@/components/chat/chat-usage-bar';

export default function ChatPage() {
  const t = useTranslations('Chat');
  const messages = useChatStore((s) => s.messages);
  const { fetchUsage, startNewConversation } = useChat();

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return (
    <motion.div
      className="h-screen pt-20 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-full max-w-2xl mx-auto px-4 sm:px-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-[-0.03em] text-text-primary">
            {t('title')}
          </h1>
          <button
            type="button"
            onClick={startNewConversation}
            className={[
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
              'font-[family-name:var(--font-sans)] text-xs font-medium text-text-secondary',
              'bg-white/[0.04] border border-border/40',
              'transition-[transform,opacity,border-color] duration-150',
              'hover:border-border-hover/60 hover:text-text-primary hover:scale-[1.02]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-muted/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
              'active:scale-[0.98]',
            ].join(' ')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
            </svg>
            {t('newChat')}
          </button>
        </div>

        {/* Usage Bar */}
        <ChatUsageBar />

        {/* Chat Container */}
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl glass-heavy border border-border/40 overflow-hidden mb-4">
          {/* Messages */}
          <ChatMessages />

          {/* Conversation limit hint */}
          {messages.length > 0 && (
            <div className="px-4 pb-1">
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted/50 text-center">
                {t('conversationHint')}
              </p>
            </div>
          )}

          {/* Input */}
          <ChatInput />
        </div>
      </div>
    </motion.div>
  );
}
