'use client';

import { useChatStore } from '@/store/chat-store';

export function ChatUsageBar() {
  const usage = useChatStore((s) => s.usage);

  const messagesToday = usage?.messagesToday ?? 0;
  const messagesLimit = usage?.messagesLimitDaily ?? 30;

  const msgPercent = messagesLimit > 0
    ? Math.min((messagesToday / messagesLimit) * 100, 100)
    : 0;

  const barColor =
    msgPercent >= 85
      ? 'bg-accent-red/80'
      : msgPercent >= 60
        ? 'bg-accent-yellow/80'
        : 'bg-accent-blue/50';

  return (
    <div className="flex items-center gap-2 mt-0.5">
      <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-secondary">
        {messagesToday}/{messagesLimit}
      </span>
      <div className="h-[2px] w-16 rounded-full bg-border/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor}`}
          style={{ width: `${msgPercent}%` }}
        />
      </div>
    </div>
  );
}
