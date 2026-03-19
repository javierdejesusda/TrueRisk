import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TrueRisk - Multi-Hazard Risk Intelligence for Spain",
    template: "%s | TrueRisk",
  },
  description:
    "Real-time weather monitoring, AI-powered risk analysis, and personalised emergency guidance for all 52 Spanish provinces.",
  openGraph: {
    title: "TrueRisk",
    description: "Multi-hazard risk intelligence for Spain",
    url: "https://truerisk.cloud",
    siteName: "TrueRisk",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
