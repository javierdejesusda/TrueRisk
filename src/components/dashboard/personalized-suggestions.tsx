'use client';

import { Streamdown } from 'streamdown';
import { usePersonalizedSuggestions } from '@/hooks/use-personalized-suggestions';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PersonalizedSuggestions() {
  const t = useTranslations('Suggestions');
  const provinceCode = useAppStore((s) => s.provinceCode);
  const locale = useAppStore((s) => s.locale);
  const { isAuthenticated } = useAuth();
  const { content, isStreaming, error, startStream } =
    usePersonalizedSuggestions();

  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-display)]">
          {t('title')}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => startStream(provinceCode, locale)}
          disabled={isStreaming}
          loading={isStreaming}
        >
          {isStreaming ? t('generating') : t('generate')}
        </Button>
      </div>

      {error && (
        <p className="text-accent-red text-sm mb-3">{error}</p>
      )}

      {content ? (
        <div className="prose prose-invert prose-sm max-w-none text-text-secondary">
          <Streamdown mode={isStreaming ? 'streaming' : 'static'}>
            {content}
          </Streamdown>
        </div>
      ) : !isStreaming && !error ? (
        <p className="text-text-muted text-sm font-[family-name:var(--font-sans)]">
          {isAuthenticated ? t('description') : t('descriptionAnonymous')}
        </p>
      ) : null}
    </Card>
  );
}
