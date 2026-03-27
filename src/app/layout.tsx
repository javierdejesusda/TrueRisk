import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthProvider } from '@/components/providers/auth-provider';
import "./globals.css";

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
