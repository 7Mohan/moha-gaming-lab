/**
 * lib/services/seo-service.ts
 * ────────────────────────────────────────────────────────────────
 * Standardized SEO metadata and JSON-LD structured data generator.
 */

import type { Metadata } from "next";
import { buildMetadata, SITE } from "../metadata";
import type { Game } from "@/types/game";
import type { App } from "@/types/app";
import type { Tool } from "@/types/tool";
import type { Guide } from "@/types/guide";

export function getGameMetadata(game: Game): Metadata {
  return buildMetadata({
    title: `${game.name} Android Performance & Optimization Guide`,
    description: game.excerpt,
    path: `/games/${game.slug}`,
  });
}

export function getAppMetadata(app: App): Metadata {
  const latest = app.releases[0];
  const versionStr = latest ? ` v${latest.version}` : "";
  return buildMetadata({
    title: `${app.name}${versionStr} — APK Download & Performance Toolkit`,
    description: app.excerpt,
    path: `/apps/${app.slug}`,
  });
}

export function getToolMetadata(tool: Tool): Metadata {
  return buildMetadata({
    title: `${tool.name} — Real-Time Android Diagnostic Tool`,
    description: tool.shortDescription,
    path: `/tools/${tool.slug}`,
  });
}

export function getGuideMetadata(guide: Guide): Metadata {
  return buildMetadata({
    title: `${guide.title} — Android Gaming Engineering Guide`,
    description: guide.excerpt,
    path: `/guides/${guide.slug}`,
  });
}

/**
 * Generates Schema.org JSON-LD BreadcrumbList
 */
export function generateBreadcrumbsJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

/**
 * Generates Schema.org SoftwareApplication JSON-LD for Android Apps
 */
export function generateAppJsonLd(app: App) {
  const latest = app.releases[0];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    operatingSystem: "Android",
    applicationCategory: app.category,
    softwareVersion: latest?.version ?? "1.0",
    description: app.excerpt,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
