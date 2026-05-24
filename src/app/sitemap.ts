import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const SITE_URL = 'https://truerisk.cloud';

type PublicRoute = {
  path: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
};

const PUBLIC_ROUTES: PublicRoute[] = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/docs', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/accessibility', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/license', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const locales = routing.locales;
  const defaultLocale = routing.defaultLocale;

  return PUBLIC_ROUTES.flatMap((route) => {
    const languages: Record<string, string> = {
      'x-default': `${SITE_URL}/${defaultLocale}${route.path}`,
    };
    for (const locale of locales) {
      languages[locale] = `${SITE_URL}/${locale}${route.path}`;
    }
    return locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages },
    }));
  });
}
