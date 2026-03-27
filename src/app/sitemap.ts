import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://truerisk.cloud';
  const locales = ['es', 'en'];
  const routes = ['/', '/map', '/prediction', '/alerts', '/emergency', '/dashboard', '/history'];

  return locales.flatMap(locale =>
    routes.map(route => ({
      url: `${baseUrl}/${locale}${route === '/' ? '' : route}`,
      lastModified: new Date(),
      changeFrequency: route === '/' ? 'weekly' : 'daily',
      priority: route === '/' ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${baseUrl}/${l}${route === '/' ? '' : route}`])
        ),
      },
    }))
  );
}
