import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { SiteShell } from "@/components/layout/SiteShell";
import { SearchProvider } from "@/features/search/SearchProvider";
import { SITE } from "@/lib/metadata";
import "@/styles/globals.css";


export const metadata: Metadata = {
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { ThemeProvider, ThemeScript } from "@/features/theme/ThemeProvider";
import { ConsentBanner } from "@/components/monetization/ConsentBanner";
import { AnalyticsListener } from "@/components/analytics/AnalyticsListener";
import { WebVitals } from "@/components/analytics/WebVitals";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={GeistMono.variable}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex flex-col min-h-dvh bg-bg-base text-text-primary antialiased transition-colors duration-200">
        <ThemeProvider>
          <SearchProvider>
            <SiteShell>
              {children}
            </SiteShell>
            <ConsentBanner />
            <AnalyticsListener />
            <WebVitals />
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

