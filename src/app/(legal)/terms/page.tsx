'use client';

import { useTranslations } from 'next-intl';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function TermsPage() {
  const t = useTranslations('Legal.terms');

  const sections = [
    { id: 'acceptance', label: t('acceptance.title') },
    { id: 'service-description', label: t('serviceDescription.title') },
    { id: 'accounts', label: t('accounts.title') },
    { id: 'acceptable-use', label: t('acceptableUse.title') },
    { id: 'risk-disclaimer', label: t('riskDisclaimer.title') },
    { id: 'community-content', label: t('communityContent.title') },
    { id: 'intellectual-property', label: t('intellectualProperty.title') },
    { id: 'liability', label: t('liability.title') },
    { id: 'availability', label: t('availability.title') },
    { id: 'termination', label: t('termination.title') },
    { id: 'governing-law', label: t('governingLaw.title') },
    { id: 'changes', label: t('changesToTerms.title') },
  ];

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <p>{t('intro')}</p>

      <h2 id="acceptance">{t('acceptance.title')}</h2>
      <p>{t('acceptance.content')}</p>

      <h2 id="service-description">{t('serviceDescription.title')}</h2>
      <p>{t('serviceDescription.content')}</p>

      <h2 id="accounts">{t('accounts.title')}</h2>
      <p>{t('accounts.content')}</p>

      <h2 id="acceptable-use">{t('acceptableUse.title')}</h2>
      <p>{t('acceptableUse.content')}</p>

      <h2 id="risk-disclaimer">{t('riskDisclaimer.title')}</h2>
      <div className="legal-callout">
        <p><strong>{t('riskDisclaimer.important')}</strong></p>
        <p>{t('riskDisclaimer.content')}</p>
      </div>
      <p>{t('riskDisclaimer.notSubstitute')}</p>
      <p>{t('riskDisclaimer.noGuarantee')}</p>

      <h2 id="community-content">{t('communityContent.title')}</h2>
      <p>{t('communityContent.content')}</p>

      <h2 id="intellectual-property">{t('intellectualProperty.title')}</h2>
      <p>{t('intellectualProperty.content')}</p>

      <h2 id="liability">{t('liability.title')}</h2>
      <p>{t('liability.content')}</p>

      <h2 id="availability">{t('availability.title')}</h2>
      <p>{t('availability.content')}</p>

      <h2 id="termination">{t('termination.title')}</h2>
      <p>{t('termination.content')}</p>

      <h2 id="governing-law">{t('governingLaw.title')}</h2>
      <p>{t('governingLaw.content')}</p>

      <h2 id="changes">{t('changesToTerms.title')}</h2>
      <p>{t('changesToTerms.content')}</p>
    </LegalPageShell>
  );
}
