'use client';

import { useTranslations } from 'next-intl';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function PrivacyPage() {
  const t = useTranslations('Legal.privacy');

  const sections = [
    { id: 'data-controller', label: t('dataController.title') },
    { id: 'data-we-collect', label: t('dataWeCollect.title') },
    { id: 'legal-basis', label: t('legalBasis.title') },
    { id: 'how-we-use', label: t('howWeUse.title') },
    { id: 'storage', label: t('storage.title') },
    { id: 'retention', label: t('retention.title') },
    { id: 'third-party', label: t('thirdParty.title') },
    { id: 'transfers', label: t('transfers.title') },
    { id: 'rights', label: t('rights.title') },
    { id: 'exercise-rights', label: t('exerciseRights.title') },
    { id: 'children', label: t('children.title') },
    { id: 'changes', label: t('changes.title') },
    { id: 'contact', label: t('contact.title') },
  ];

  const dataCategories = [
    'identity', 'location', 'health', 'emergency', 'household', 'building',
    'economic', 'safety', 'family', 'community', 'preparedness', 'notifications',
  ] as const;

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <p>{t('intro')}</p>

      <h2 id="data-controller">{t('dataController.title')}</h2>
      <p>{t('dataController.content')}</p>

      <h2 id="data-we-collect">{t('dataWeCollect.title')}</h2>
      <p>{t('dataWeCollect.intro')}</p>
      {dataCategories.map((cat) => (
        <div key={cat}>
          <h3>{t(`dataWeCollect.${cat}.title`)}</h3>
          <p>{t(`dataWeCollect.${cat}.content`)}</p>
        </div>
      ))}

      <h2 id="legal-basis">{t('legalBasis.title')}</h2>
      <p>{t('legalBasis.intro')}</p>
      <ul>
        <li><strong>{t('legalBasis.consent')}</strong></li>
        <li><strong>{t('legalBasis.contract')}</strong></li>
        <li><strong>{t('legalBasis.legitimate')}</strong></li>
        <li><strong>{t('legalBasis.vital')}</strong></li>
      </ul>

      <h2 id="how-we-use">{t('howWeUse.title')}</h2>
      <p>{t('howWeUse.content')}</p>

      <h2 id="storage">{t('storage.title')}</h2>
      <p>{t('storage.content')}</p>

      <h2 id="retention">{t('retention.title')}</h2>
      <p>{t('retention.content')}</p>

      <h2 id="third-party">{t('thirdParty.title')}</h2>
      <p>{t('thirdParty.intro')}</p>
      <ul>
        <li>{t('thirdParty.google')}</li>
        <li>{t('thirdParty.github')}</li>
        <li>{t('thirdParty.openmeteo')}</li>
        <li>{t('thirdParty.aemet')}</li>
        <li>{t('thirdParty.maplibre')}</li>
        <li>{t('thirdParty.nominatim')}</li>
      </ul>

      <h2 id="transfers">{t('transfers.title')}</h2>
      <p>{t('transfers.content')}</p>

      <h2 id="rights">{t('rights.title')}</h2>
      <p>{t('rights.intro')}</p>
      <ul>
        <li>{t('rights.access')}</li>
        <li>{t('rights.rectification')}</li>
        <li>{t('rights.erasure')}</li>
        <li>{t('rights.portability')}</li>
        <li>{t('rights.restriction')}</li>
        <li>{t('rights.objection')}</li>
        <li>{t('rights.withdraw')}</li>
      </ul>

      <h2 id="exercise-rights">{t('exerciseRights.title')}</h2>
      <p>{t('exerciseRights.content')}</p>

      <h2 id="children">{t('children.title')}</h2>
      <p>{t('children.content')}</p>

      <h2 id="changes">{t('changes.title')}</h2>
      <p>{t('changes.content')}</p>

      <h2 id="contact">{t('contact.title')}</h2>
      <p>{t('contact.content')}</p>
      <ul>
        <li>
          <a href={`mailto:${t('contact.email')}`}>{t('contact.email')}</a>
        </li>
        <li>
          <a href={`https://${t('contact.github')}`} target="_blank" rel="noopener noreferrer">
            {t('contact.github')}
          </a>
        </li>
      </ul>
    </LegalPageShell>
  );
}
