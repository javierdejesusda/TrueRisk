import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

const SITE_URL = 'https://truerisk.cloud';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'seo.accessibility' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/accessibility`,
      languages: {
        es: `${SITE_URL}/es/accessibility`,
        en: `${SITE_URL}/en/accessibility`,
        'x-default': `${SITE_URL}/es/accessibility`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}/accessibility`,
      type: 'article',
    },
  };
}

export default async function AccessibilityPage() {
  const t = await getTranslations('Legal.accessibility');

  const sections = [
    { id: 'commitment', label: t('commitment.title') },
    { id: 'features', label: t('features.title') },
    { id: 'limitations', label: t('limitations.title') },
    { id: 'assistive', label: t('assistive.title') },
    { id: 'reporting', label: t('reporting.title') },
    { id: 'contact', label: t('contact.title') },
  ];

  const featureKeys = [
    'skipLink', 'semantic', 'keyboard', 'aria', 'contrast', 'responsive', 'motion', 'focus',
  ] as const;

  return (
    <LegalPageShell titleKey={t('title')} lastUpdated="2026-03-29" sections={sections}>
      <h2 id="commitment">{t('commitment.title')}</h2>
      <p>{t('commitment.content')}</p>

      <h2 id="features">{t('features.title')}</h2>
      <ul>
        {featureKeys.map((key) => (
          <li key={key}>{t(`features.${key}`)}</li>
        ))}
      </ul>

      <h2 id="limitations">{t('limitations.title')}</h2>
      <ul>
        <li><strong>MapLibre GL</strong> — {t('limitations.map')}</li>
        <li><strong>Recharts</strong> — {t('limitations.charts')}</li>
        <li><strong>SSE</strong> — {t('limitations.realtime')}</li>
      </ul>

      <h2 id="assistive">{t('assistive.title')}</h2>
      <p>{t('assistive.content')}</p>

      <h2 id="reporting">{t('reporting.title')}</h2>
      <p>{t('reporting.content')}</p>
      <p>
        <a href={`https://${t('reporting.github')}`} target="_blank" rel="noopener noreferrer">
          {t('reporting.github')}
        </a>
      </p>

      <h2 id="contact">{t('contact.title')}</h2>
      <p>{t('contact.content')}</p>
      <ul>
        <li>
          <a href={`mailto:${t('contact.email')}`}>{t('contact.email')}</a>
        </li>
      </ul>
    </LegalPageShell>
  );
}
