import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://truerisk.cloud';
  const routes = ['', '/map', '/prediction', '/alerts', '/emergency', '/dashboard', '/history'];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'daily',
    priority: route === '' ? 1 : 0.8,
  }));
}
