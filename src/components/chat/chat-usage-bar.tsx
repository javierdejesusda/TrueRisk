'use client';

import { useChatStore } from '@/store/chat-store';

export function ChatUsageBar() {
  const usage = useChatStore((s) => s.usage);

  if (!usage) return null;

  const msgPercent = usage.messagesLimitDaily > 0
    ? Math.min((usage.messagesToday / usage.messagesLimitDaily) * 100, 100)
    : 0;

  const tokenPercent = usage.tokensLimitDaily > 0
    ? Math.min((usage.tokensToday / usage.tokensLimitDaily) * 100, 100)
    : 0;

  const barPercent = Math.max(msgPercent, tokenPercent);

  const barColor =
    barPercent >= 85
      ? 'bg-accent-red/80'
      : barPercent >= 60
        ? 'bg-accent-yellow/80'
        : 'bg-accent-blue/50';

  return (
    <div className="flex items-center gap-2 mt-0.5">
      <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted/50">
        {usage.messagesToday}/{usage.messagesLimitDaily}
      </span>
      <div className="h-[2px] w-16 rounded-full bg-border/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor}`}
          style={{ width: `${barPercent}%` }}
        />
      </div>
    </div>
  );
}
