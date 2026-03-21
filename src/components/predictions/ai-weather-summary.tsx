'use client';

import { Streamdown } from 'streamdown';
import { useAiSummary } from '@/hooks/use-ai-summary';
import { useAppStore } from '@/store/app-store';
import { useTranslations } from 'next-intl';

export function AiWeatherSummary() {
  const t = useTranslations('AiSummary');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const locale = useAppStore((s) => s.locale);
  const { content, isStreaming, error, startStream } = useAiSummary();

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-[family-name:var(--font-display)]">
          {t('title')}
        </h3>
        <button
          onClick={() => startStream(provinceCode, locale)}
          disabled={isStreaming}
          className="rounded-lg bg-[var(--color-accent-blue)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isStreaming ? t('generating') : t('generate')}
        </button>
      </div>

      {error && (
        <p className="text-[var(--color-accent-red)] text-sm mb-3">{error}</p>
      )}

      {content ? (
        <div className="prose prose-invert prose-sm max-w-none text-[var(--color-text-secondary)]">
          {isStreaming ? (
            <div className="whitespace-pre-wrap font-[family-name:var(--font-sans)] text-sm leading-relaxed">
              {content}
            </div>
          ) : (
            <Streamdown mode="static">
              {content}
            </Streamdown>
          )}
        </div>
      ) : !isStreaming && !error ? (
        <p className="text-[var(--color-text-muted)] text-sm">
          {t('description')}
        </p>
      ) : null}
    </div>
  );
}
