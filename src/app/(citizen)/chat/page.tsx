'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useChatStore } from '@/store/chat-store';
import { useChat } from '@/hooks/use-chat';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatUsageBar } from '@/components/chat/chat-usage-bar';
import { RotateCcw } from 'lucide-react';

export default function ChatPage() {
  const t = useTranslations('Chat');
  const messages = useChatStore((s) => s.messages);
  const { fetchUsage, startNewConversation } = useChat();

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return (
    <motion.div
      className="h-full pt-20 overflow-hidden bg-bg-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="h-full max-w-3xl mx-auto px-4 sm:px-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            {/* AI avatar glow */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-accent-blue/20 blur-md" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue/30 to-accent-purple/20 border border-white/[0.08]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 1 1 0 4h-1.17A7 7 0 0 1 14 23h-4a7 7 0 0 1-6.83-5H2a2 2 0 1 1 0-4h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                  <circle cx="10" cy="16" r="1" fill="currentColor" />
                  <circle cx="14" cy="16" r="1" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.02em] text-text-primary">
                {t('title')}
              </h1>
              <ChatUsageBar />
            </div>
          </div>
          <button
            type="button"
            onClick={startNewConversation}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-[family-name:var(--font-sans)] text-[11px] font-medium text-text-secondary bg-white/[0.04] border border-border/40 transition-all duration-200 hover:bg-white/[0.08] hover:text-text-primary hover:border-border-hover/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30 active:scale-[0.97] cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            {t('newChat')}
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Messages — takes all available space */}
          <div className="flex-1 min-h-0">
            <ChatMessages />
          </div>

          {/* Conversation limit hint */}
          {messages.length > 0 && (
            <div className="py-1 text-center">
              <span className="font-[family-name:var(--font-mono)] text-[9px] text-text-secondary/60 tracking-wide uppercase">
                {t('conversationLimitHint', { count: messages.length, limit: 20 })}
              </span>
            </div>
          )}

          {/* Input */}
          <div className="pb-4">
            <ChatInput />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
