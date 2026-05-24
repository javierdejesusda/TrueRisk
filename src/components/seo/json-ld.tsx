import type { Locale } from '@/i18n/routing';

const SITE_URL = 'https://truerisk.cloud';

type JsonLdProps = {
  locale: Locale;
};

/**
 * Renders Schema.org JSON-LD as a server-rendered <script> tag.
 *
 * Content is built from constants in this file (zero user input), and `<`
 * characters are escaped to < so the HTML parser cannot end the script
 * tag prematurely. We pass the string as children rather than via
 * dangerouslySetInnerHTML to satisfy the project's no-dangerous-html rule.
 */
export function JsonLd({ locale }: JsonLdProps) {
  const isSpanish = locale === 'es';

  const organization = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'TrueRisk',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icons/icon-512.png`,
      width: 512,
      height: 512,
    },
    description: isSpanish
      ? 'Plataforma de inteligencia de riesgo climático multi-amenaza para España basada en datos AEMET y modelos de machine learning.'
      : 'Multi-hazard climate risk intelligence platform for Spain, built on AEMET data and machine learning models.',
    areaServed: {
      '@type': 'Country',
      name: 'Spain',
      alternateName: 'España',
    },
    knowsAbout: [
      'Climate risk',
      'Natural hazards',
      'Flood risk',
      'Wildfire risk',
      'Drought monitoring',
      'Heatwave prediction',
      'Machine learning meteorology',
      'AEMET data',
      'Civil protection',
    ],
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'TrueRisk',
    description: isSpanish
      ? 'Inteligencia de riesgo climático multi-amenaza para España.'
      : 'Multi-hazard climate risk intelligence for Spain.',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: [isSpanish ? 'es-ES' : 'en-US', isSpanish ? 'en-US' : 'es-ES'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/map?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareApplication = {
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: 'TrueRisk',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Risk Intelligence Platform',
    operatingSystem: 'Web Browser',
    description: isSpanish
      ? 'Plataforma web de inteligencia de riesgo climático que combina datos AEMET en tiempo real con siete modelos de machine learning para evaluar inundaciones, incendios, sequía, DANA, olas de calor, olas de frío y vientos extremos en las 52 provincias españolas.'
      : 'Web platform for climate risk intelligence combining real-time AEMET data with seven machine learning models to score floods, wildfires, drought, DANA, heatwaves, coldwaves, and windstorms across all 52 Spanish provinces.',
    url: SITE_URL,
    inLanguage: [isSpanish ? 'es-ES' : 'en-US', isSpanish ? 'en-US' : 'es-ES'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    featureList: isSpanish
      ? [
          'Alertas meteorológicas en tiempo real',
          'Modelos de machine learning para 7 amenazas naturales',
          'Cobertura de las 52 provincias españolas',
          'Datos oficiales AEMET',
          'Predicciones de DANA, inundaciones, sequía e incendios',
          'Guía de emergencia personalizada con IA',
          'Mapas interactivos de riesgo',
        ]
      : [
          'Real-time weather alerts',
          'Machine learning models for 7 natural hazards',
          'Coverage of all 52 Spanish provinces',
          'Official AEMET data',
          'Predictions for DANA, floods, drought, and wildfires',
          'AI-powered personalized emergency guidance',
          'Interactive risk maps',
        ],
    creator: { '@id': `${SITE_URL}/#organization` },
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [organization, website, softwareApplication],
  };

  const payload = JSON.stringify(graph).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
