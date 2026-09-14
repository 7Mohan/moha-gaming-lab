/**
 * lib/monetization/config.ts
 * ────────────────────────────────────────────────────────────────
 * Centralized configuration, placement registry, dimension tokens,
 * and frequency caps for Phase 13 Monetization architecture.
 */

import type {
  AdDimensions,
  AdFormat,
  AdPageType,
  AdPlacementConfig,
  AdProviderType,
} from "./types";

/**
 * Format dimension specifications to strictly prevent Cumulative Layout Shift (CLS).
 * Every AdSlot component pre-allocates this height before rendering any external script.
 */
export const FORMAT_DIMENSIONS: Record<AdFormat, AdDimensions> = {
  BANNER_HORIZONTAL: {
    minHeight: 90,
    maxWidth: 728,
  },
  RECTANGLE_MEDIUM: {
    minHeight: 250,
    maxWidth: 300,
  },
  RESPONSIVE: {
    minHeight: 120,
    maxWidth: 840,
  },
  SPONSORED_CARD: {
    minHeight: 100,
    maxWidth: 840,
  },
};

/**
 * Maximum ad frequency limits per page type.
 * Enforces strong content hierarchy and prevents ad clutter.
 */
export const MAX_ADS_PER_PAGE: Record<AdPageType, number> = {
  HOME: 2,
  GAME: 2,
  APP: 2,
  TOOL: 1,      // Minimal advertising on utility diagnostics
  GUIDE: 2,
  DOWNLOAD: 1,  // Single separated banner only
};

/**
 * Default pre-approved ad placements.
 */
export const DEFAULT_PLACEMENTS: Record<string, AdPlacementConfig> = {
  homepage_after_hero: {
    key: "homepage_after_hero",
    name: "Homepage Below Strip",
    description: "Horizontal leaderboard banner below capability strip",
    pageType: "HOME",
    location: "after_hero",
    format: "BANNER_HORIZONTAL",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
  homepage_before_footer: {
    key: "homepage_before_footer",
    name: "Homepage Before Footer",
    description: "Responsive banner placed before the global footer",
    pageType: "HOME",
    location: "before_footer",
    format: "RESPONSIVE",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
  games_hub_between_sections: {
    key: "games_hub_between_sections",
    name: "Games Hub Divider",
    description: "Banner placed between featured games and genres",
    pageType: "GAME",
    location: "between_sections",
    format: "BANNER_HORIZONTAL",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
  game_after_overview: {
    key: "game_after_overview",
    name: "Game Detail Overview",
    description: "Responsive slot below game hardware specifications",
    pageType: "GAME",
    location: "after_overview",
    format: "RESPONSIVE",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
  apps_hub_between_sections: {
    key: "apps_hub_between_sections",
    name: "Apps Hub Divider",
    description: "Horizontal banner between APK catalog sections",
    pageType: "APP",
    location: "between_sections",
    format: "BANNER_HORIZONTAL",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
  app_after_overview: {
    key: "app_after_overview",
    name: "App Detail Overview",
    description: "Separated banner below app overview and before guides",
    pageType: "APP",
    location: "after_overview",
    format: "RESPONSIVE",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
  guide_mid_content: {
    key: "guide_mid_content",
    name: "Guide Mid-Article",
    description: "Medium rectangle placement between guide technical sections",
    pageType: "GUIDE",
    location: "mid_content",
    format: "RECTANGLE_MEDIUM",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
  guide_after_content: {
    key: "guide_after_content",
    name: "Guide Post-Article",
    description: "Responsive banner below guide conclusions",
    pageType: "GUIDE",
    location: "after_content",
    format: "RESPONSIVE",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
  tool_after_result: {
    key: "tool_after_result",
    name: "Tool Result Banner",
    description: "Placed below interactive diagnostic outputs",
    pageType: "TOOL",
    location: "after_result",
    format: "BANNER_HORIZONTAL",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
  download_bottom: {
    key: "download_bottom",
    name: "Download Page Footer",
    description: "Clearly separated banner at bottom of downloads page",
    pageType: "DOWNLOAD",
    location: "bottom",
    format: "BANNER_HORIZONTAL",
    enabled: true,
    provider: "TEST_PLACEHOLDER",
    device: "ALL",
  },
};

/**
 * Returns whether monetization is globally enabled.
 */
export function isMonetizationEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_MONETIZATION_ENABLED === "false") {
    return false;
  }
  return true;
}

/**
 * Resolves the active ad provider type.
 */
export function getActiveProviderType(): AdProviderType {
  const envProvider = (process.env.NEXT_PUBLIC_AD_PROVIDER || "").toUpperCase();
  if (envProvider === "ADSENSE") return "ADSENSE";
  if (envProvider === "DIRECT_SPONSOR") return "DIRECT_SPONSOR";
  if (envProvider === "AFFILIATE") return "AFFILIATE";
  return "TEST_PLACEHOLDER";
}

/**
 * Returns whether test mode is active (development, test, or explicit ADS_TEST_MODE).
 */
export function isAdTestMode(): boolean {
  if (process.env.ADS_TEST_MODE === "false") return false;
  if (process.env.ADS_TEST_MODE === "true") return true;
  return process.env.NODE_ENV !== "production";
}

/**
 * Retrieves dimensions for a specified format.
 */
export function getDimensionsForFormat(format: AdFormat): AdDimensions {
  return FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.RESPONSIVE;
}

/**
 * Retrieves placement configuration by key.
 */
export function getPlacementConfig(key: string): AdPlacementConfig | null {
  return DEFAULT_PLACEMENTS[key] ?? null;
}
