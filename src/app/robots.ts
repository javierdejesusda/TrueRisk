import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const SITE_URL = 'https://truerisk.cloud';

const PRIVATE_PATHS = [
  '/backoffice',
  '/dashboard',
  '/alerts',
  '/map',
  '/prediction',
  '/emergency',
  '/history',
  '/drought',
  '/evacuation',
  '/preparedness',
  '/safety',
  '/chat',
  '/phrases',
  '/report',
  '/profile',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/api/'];
  for (const locale of routing.locales) {
    for (const path of PRIVATE_PATHS) {
      disallow.push(`/${locale}${path}`);
    }
  }
  for (const path of PRIVATE_PATHS) {
    disallow.push(path);
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
