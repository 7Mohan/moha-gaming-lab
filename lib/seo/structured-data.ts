/**
 * lib/seo/structured-data.ts
 * ────────────────────────────────────────────────────────────────
 * Centralized Schema.org JSON-LD Generators for Moha Gaming Lab.
 * Generates verified, valid structured data for Games, Apps, Tools, Guides,
 * Breadcrumbs, and Organization. NO fake reviews, fake ratings, or fake stats.
 */

import { SITE } from "../metadata";
import { buildCanonicalUrl } from "./canonical";
import type { Game } from "@/types/game";
import type { App } from "@/types/app";
import type { Tool } from "@/types/tool";
import type { Guide } from "@/types/guide";

/**
 * Organization and WebSite Schema.org specification
 */
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon.svg`,
    description: SITE.description,
    sameAs: [
      "https://github.com/moha-gaming-lab",
    ],
  };
}

export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * VideoGame Schema for Games Hub
 */
export function generateGameJsonLd(game: Game) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    description: game.excerpt,
    url: buildCanonicalUrl(`/games/${game.slug}`),
    image: game.coverImage ? `${SITE.url}${game.coverImage}` : undefined,
    genre: game.category ? [game.category] : undefined,
    gamePlatform: ["Android", "Mobile"],
    applicationCategory: "Game",
  };
}

/**
 * SoftwareApplication Schema for Android Apps & Tools
 * Strictly uses REAL verified release information.
 */
export function generateAppJsonLd(app: App) {
  const latest = app.releases[0];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    operatingSystem: "Android",
    applicationCategory: app.category || "UtilitiesApplication",
    softwareVersion: latest?.version ?? "1.0",
    description: app.excerpt,
    url: buildCanonicalUrl(`/apps/${app.slug}`),
    author: {
      "@type": "Organization",
      name: app.developer || SITE.name,
      url: app.developerUrl || SITE.url,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    fileSize: latest?.fileSize ? `${Math.round(Number(latest.fileSize) / (1024 * 1024))}MB` : undefined,
  };
}

/**
 * WebApplication Schema for Diagnostic Tools
 */
export function generateToolJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.shortDescription,
    url: buildCanonicalUrl(`/tools/${tool.slug}`),
    applicationCategory: "BrowserApplication",
    operatingSystem: "All (Web Browser)",
    browserRequirements: tool.browserSupport || "Requires modern HTML5 canvas/web-standards browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/**
 * TechArticle Schema for Technical Engineering Guides
 */
export function generateGuideJsonLd(guide: Guide) {
  const authorName = guide.author?.name || "Moha Gaming Lab Engineering";

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.excerpt,
    url: buildCanonicalUrl(`/guides/${guide.slug}`),
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt || guide.publishedAt,
    author: {
      "@type": "Organization",
      name: authorName,
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": buildCanonicalUrl(`/guides/${guide.slug}`),
    },
  };
}

/**
 * BreadcrumbList Schema for Navigation Hierarchy
 */
export function generateBreadcrumbsJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}
