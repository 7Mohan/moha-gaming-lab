import type { Metadata } from "next";

const SITE_NAME = "Moha Gaming Lab";
const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://mohagaminglab.com";
const SITE_DESCRIPTION =
  "Android gaming optimization, FPS diagnostics, performance tools, and gaming guides for serious players.";

interface BuildMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * Builds a consistent Next.js Metadata object for each page.
 * Call this in every page.tsx to ensure proper SEO coverage.
 */
export function buildMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "",
  ogImage = "/og-default.png",
  noIndex = false,
}: BuildMetadataOptions = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = `${SITE_URL}${path}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    other: {
      // Advertising preparation: placeholder for future ad verification tags
      // "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_ID ?? "",
    },
  };
}

/** Site-level constants for use in structured data */
export const SITE = {
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
} as const;
