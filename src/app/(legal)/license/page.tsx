'use client';

import { useTranslations } from 'next-intl';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function LicensePage() {
  const t = useTranslations('Legal.license');

  const sections = [
    { id: 'mit-license', label: t('mitTitle') },
    { id: 'what-this-means', label: t('whatThisMeans.title') },
    { id: 'contributing', label: t('contributing.title') },
    { id: 'third-party', label: t('thirdParty.title') },
  ];

  const thirdPartyKeys = [
    'nextjs', 'react', 'maplibre', 'fastapi', 'tailwind', 'framer', 'recharts', 'zustand', 'lucide',
  ] as const;

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <p>{t('intro')}</p>

      <h2 id="mit-license">{t('mitTitle')}</h2>
      <pre>{t('mitText')}</pre>

      <h2 id="what-this-means">{t('whatThisMeans.title')}</h2>
      <p>{t('whatThisMeans.content')}</p>
      <ul>
        <li>{t('whatThisMeans.use')}</li>
        <li>{t('whatThisMeans.modify')}</li>
        <li>{t('whatThisMeans.distribute')}</li>
        <li>{t('whatThisMeans.sublicense')}</li>
      </ul>
      <p>{t('whatThisMeans.condition')}</p>

      <h2 id="contributing">{t('contributing.title')}</h2>
      <p>{t('contributing.content')}</p>
      <p>
        <a href={`https://${t('contributing.github')}`} target="_blank" rel="noopener noreferrer">
          {t('contributing.github')}
        </a>
      </p>

      <h2 id="third-party">{t('thirdParty.title')}</h2>
      <p>{t('thirdParty.intro')}</p>
      <ul>
        {thirdPartyKeys.map((key) => (
          <li key={key}>{t(`thirdParty.items.${key}`)}</li>
        ))}
      </ul>
    </LegalPageShell>
  );
}
