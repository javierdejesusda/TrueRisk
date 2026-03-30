'use client';

import { useTranslations } from 'next-intl';
import { useChatStore } from '@/store/chat-store';

export function ChatUsageBar() {
  const t = useTranslations('Chat');
  const usage = useChatStore((s) => s.usage);

  if (!usage) return null;

  const messagePercent = usage.messagesLimitDaily > 0
    ? Math.min((usage.messagesToday / usage.messagesLimitDaily) * 100, 100)
    : 0;

  const tokenPercent = usage.tokensLimitDaily > 0
    ? Math.min((usage.tokensToday / usage.tokensLimitDaily) * 100, 100)
    : 0;

  const barPercent = Math.max(messagePercent, tokenPercent);

  // Color transitions: green -> yellow -> red
  const barColor =
    barPercent >= 90
      ? 'bg-accent-red'
      : barPercent >= 70
        ? 'bg-accent-yellow'
        : 'bg-emerald-500';

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
          {t('usageMessages', {
            count: usage.messagesToday,
            limit: usage.messagesLimitDaily,
          })}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
          {t('usageTokens', { percent: Math.round(tokenPercent) })}
        </span>
      </div>
      <div className="h-[1px] w-full rounded-full bg-border/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${barColor}`}
          style={{ width: `${barPercent}%` }}
        />
      </div>
    </div>
  );
}
