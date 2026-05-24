import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BackgroundGlobe } from '@/components/landing/background-globe';
import type { Locale } from '@/i18n/routing';

const SITE_URL = 'https://truerisk.cloud';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'seo.home' });

  return {
    title: { absolute: t('title') },
    description: t('description'),
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        es: `${SITE_URL}/es`,
        en: `${SITE_URL}/en`,
        'x-default': `${SITE_URL}/es`,
      },
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: `${SITE_URL}/${locale}`,
      type: 'website',
    },
  };
}

export default async function Home() {
  const t = await getTranslations('Home');
  const locale = (await getLocale()) as Locale;
  const fullTagline =
    locale === 'es'
      ? 'TrueRisk: Inteligencia de Riesgo Climático Multi-Amenaza para España'
      : 'TrueRisk: Multi-Hazard Climate Risk Intelligence for Spain';

  const valueProps = [
    t('valueProps.monitoring'),
    t('valueProps.models'),
    t('valueProps.hazards'),
    t('valueProps.coverage'),
  ];

  const textShadow =
    '0 2px 20px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.9)';
  const textShadowSm =
    '0 2px 12px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.9)';

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-bg-primary">
      <BackgroundGlobe />

      <section
        aria-labelledby="landing-heading"
        className="relative z-10 flex h-screen flex-col items-center justify-center px-4 text-center"
      >
        <h1
          id="landing-heading"
          className="font-[family-name:var(--font-display)] text-6xl font-extrabold tracking-tighter text-text-primary sm:text-7xl lg:text-8xl"
          style={{
            textShadow,
            animation: 'slide-up 0.7s ease-out 0.6s both',
          }}
        >
          <span aria-hidden="true">
            True<span className="text-accent-green">Risk</span>
          </span>
          <span className="sr-only">{fullTagline}</span>
        </h1>

        <p
          className="mt-4 max-w-2xl font-[family-name:var(--font-sans)] text-lg font-light text-text-primary sm:text-xl"
          style={{
            textShadow: textShadowSm,
            animation: 'slide-up 0.5s ease-out 0.85s both',
          }}
        >
          {t('subtitle')}
        </p>

        <p
          className="mt-2 max-w-md text-sm text-text-primary/85"
          style={{
            textShadow: textShadowSm,
            animation: 'slide-up 0.5s ease-out 1s both',
          }}
        >
          {t('description')}
        </p>

        <div
          className="mt-10 flex flex-col gap-3 sm:flex-row"
          style={{ animation: 'slide-up 0.5s ease-out 1.15s both' }}
        >
          <Link
            href="/map"
            className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-accent-green px-10 text-base font-semibold text-bg-primary transition-all hover:brightness-110 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-[0.97]"
          >
            {t('enterButton')}
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </Link>
        </div>

        <ul className="sr-only">
          {valueProps.map((prop) => (
            <li key={prop}>{prop}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
