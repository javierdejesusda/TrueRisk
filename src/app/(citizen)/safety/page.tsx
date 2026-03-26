'use client';

import { useTranslations } from 'next-intl';
import { PageTransition } from '@/components/layout/page-transition';
import { useSafetyCheck } from '@/hooks/use-safety-check';
import { SafetyCheckButton } from '@/components/safety/safety-check-button';
import { FamilyStatusList } from '@/components/safety/family-status-list';
import { FamilyLinkManager } from '@/components/safety/family-link-manager';

export default function SafetyPage() {
  const t = useTranslations('Safety');
  const {
    familyStatus,
    checkIns,
    pendingLinks,
    isLoading,
    error,
    checkIn,
    createLink,
    acceptLink,
    deleteLink,
    requestCheckIn,
  } = useSafetyCheck();

  const lastCheckIn = checkIns.length > 0 ? checkIns[0] : null;

  if (isLoading) {
    return (
      <PageTransition transitionKey="safety">
        <div className="h-full flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition transitionKey="safety">
      <div className="h-full overflow-y-auto pt-20 pb-6 px-4 sm:px-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
            {t('title')}
          </h1>
          {error && error !== 'auth_required' && (
            <p className="mt-2 font-[family-name:var(--font-sans)] text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {error === 'auth_required' ? (
          <div className="glass-heavy rounded-2xl p-6 text-center">
            <p className="text-text-secondary text-sm mb-3">{t('loginRequired')}</p>
            <a
              href="/login"
              className="inline-block px-4 py-2 rounded-lg bg-accent-green/15 text-accent-green text-sm font-medium hover:bg-accent-green/25 transition-colors"
            >
              {t('loginButton')}
            </a>
          </div>
        ) : (
        <div className="flex flex-col gap-5">
          <SafetyCheckButton
            onCheckIn={checkIn}
            lastCheckIn={lastCheckIn}
          />

          <FamilyStatusList
            familyStatus={familyStatus}
            onRequestCheckIn={requestCheckIn}
          />

          <FamilyLinkManager
            familyStatus={familyStatus}
            pendingLinks={pendingLinks}
            onCreateLink={createLink}
            onAcceptLink={acceptLink}
            onDeleteLink={deleteLink}
          />
        </div>
        )}
      </div>
    </PageTransition>
  );
}
