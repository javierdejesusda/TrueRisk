import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TrueRisk - Inteligencia de Riesgo Climático para España',
    short_name: 'TrueRisk',
    description:
      'Plataforma de inteligencia de riesgo climático multi-amenaza para las 52 provincias españolas: alertas en tiempo real, modelos de IA y datos AEMET.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    categories: ['weather', 'utilities', 'productivity'],
    lang: 'es-ES',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
