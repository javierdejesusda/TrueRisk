import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { DocsInteractive } from '@/components/legal/docs-interactive';

const SITE_URL = 'https://truerisk.cloud';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'seo.docs' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/docs`,
      languages: {
        es: `${SITE_URL}/es/docs`,
        en: `${SITE_URL}/en/docs`,
        'x-default': `${SITE_URL}/es/docs`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}/docs`,
      type: 'article',
    },
  };
}

export default function DocsPage() {
  return <DocsInteractive />;
}
