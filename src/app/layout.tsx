import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthProvider } from '@/components/providers/auth-provider';
import { CookieBanner } from '@/components/legal/cookie-banner';
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "TrueRisk - Multi-Hazard Risk Intelligence for Spain",
    template: "%s | TrueRisk",
  },
  description:
    "Real-time weather monitoring, AI-powered risk analysis, and personalised emergency guidance for all 52 Spanish provinces.",
  keywords: ["risk intelligence", "weather monitoring", "machine learning", "Spain", "natural hazards"],
  openGraph: {
    title: "TrueRisk",
    description: "Multi-hazard risk intelligence for Spain",
    url: "https://truerisk.cloud",
    siteName: "TrueRisk",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueRisk — Multi-Hazard Risk Intelligence",
    description: "AI-powered risk scoring across 7 natural hazards for all 52 Spanish provinces",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black">
          Skip to content
        </a>
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            <main id="main-content">
              {children}
            </main>
            <CookieBanner />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
