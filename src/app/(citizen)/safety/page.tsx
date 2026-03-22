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
    checkIn,
    getFamilyStatus: _getFamilyStatus,
    createLink,
    acceptLink,
    deleteLink,
    requestCheckIn,
  } = useSafetyCheck();

  const lastCheckIn = checkIns.length > 0 ? checkIns[0] : null;

  return (
    <PageTransition transitionKey="safety">
      <div className="h-full overflow-y-auto pt-20 pb-6 px-4 sm:px-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-text-primary">
            {t('title')}
          </h1>
        </div>

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
      </div>
    </PageTransition>
  );
}
