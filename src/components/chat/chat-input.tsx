'use client';

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useChatStore } from '@/store/chat-store';
import { useChat } from '@/hooks/use-chat';

const MAX_CHARS = 500;
const WARN_THRESHOLD = 450;
const MAX_HEIGHT = 100;

export function ChatInput() {
  const t = useTranslations('Chat');
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = useChatStore((s) => s.isStreaming);
  const canSend = useChatStore((s) => s.usage?.canSend ?? true);
  const { sendMessage } = useChat();

  const isEmpty = value.trim().length === 0;
  const isDisabled = isEmpty || isStreaming || !canSend;

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      if (next.length <= MAX_CHARS) {
        setValue(next);
      }
      requestAnimationFrame(autoResize);
    },
    [autoResize],
  );

  const handleSend = useCallback(() => {
    if (isDisabled) return;
    const msg = value.trim();
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    sendMessage(msg);
  }, [isDisabled, value, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="border-t border-border/30 p-3">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CHARS}
            rows={1}
            placeholder={t('inputPlaceholder')}
            disabled={isStreaming}
            className={[
              'w-full resize-none rounded-xl bg-white/[0.04] px-4 py-2.5',
              'font-[family-name:var(--font-sans)] text-sm text-text-primary leading-[1.6]',
              'placeholder:text-text-muted/60',
              'border border-border/30',
              'transition-colors duration-150',
              'hover:border-border-hover/60',
              'focus:outline-none focus:border-text-muted/40 focus:ring-1 focus:ring-text-muted/10',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
            style={{ maxHeight: `${MAX_HEIGHT}px` }}
          />
          <span
            className={[
              'absolute bottom-1.5 right-3 font-[family-name:var(--font-mono)] text-[10px] select-none',
              value.length > WARN_THRESHOLD ? 'text-accent-red' : 'text-text-muted/50',
            ].join(' ')}
          >
            {value.length}/{MAX_CHARS}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={isDisabled}
          aria-label={t('send')}
          className={[
            'flex-shrink-0 flex items-center justify-center',
            'h-10 w-10 rounded-xl',
            'bg-text-primary/90 text-bg-primary',
            'transition-[transform,opacity] duration-150',
            'hover:bg-text-primary hover:scale-105',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-muted/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
            'active:scale-95',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95l14.095-5.637a.75.75 0 0 0 0-1.395L3.105 2.288Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
