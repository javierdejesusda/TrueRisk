import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { AuthProvider } from '@/components/providers/auth-provider';
import { LocaleSync } from '@/components/providers/locale-sync';
import { CookieBanner } from '@/components/legal/cookie-banner';
import { JsonLd } from '@/components/seo/json-ld';
import type { Locale } from '@/i18n/routing';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

const SITE_URL = 'https://truerisk.cloud';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'seo' });

  const ogLocale = locale === 'es' ? 'es_ES' : 'en_US';
  const altLocale = locale === 'es' ? 'en_US' : 'es_ES';

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('home.title'),
      template: '%s | TrueRisk',
    },
    description: t('home.description'),
    applicationName: 'TrueRisk',
    keywords: t.raw('keywords') as string[],
    authors: [{ name: 'TrueRisk', url: SITE_URL }],
    creator: 'TrueRisk',
    publisher: 'TrueRisk',
    category: 'technology',
    formatDetection: { email: false, address: false, telephone: false },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        es: '/es',
        en: '/en',
        'x-default': '/es',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'TrueRisk',
      title: t('home.ogTitle'),
      description: t('home.ogDescription'),
      url: `${SITE_URL}/${locale}`,
      locale: ogLocale,
      alternateLocale: [altLocale],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('home.ogTitle'),
      description: t('home.ogDescription'),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/icons/icon-512.png', sizes: '512x512' }],
    },
    manifest: '/manifest.webmanifest',
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#0a0a0a' },
  ],
  colorScheme: 'dark',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <JsonLd locale={locale} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black"
        >
          Skip to content
        </a>
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            <LocaleSync />
            <main id="main-content">{children}</main>
            <CookieBanner />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
