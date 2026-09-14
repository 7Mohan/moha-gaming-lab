/**
 * lib/monetization/types.ts
 * ────────────────────────────────────────────────────────────────
 * Core contracts, enums, and data models for Phase 13 Monetization
 * and Advertising architecture.
 */

import type React from "react";

export type AdPageType = "HOME" | "GAME" | "APP" | "TOOL" | "GUIDE" | "DOWNLOAD";

export type AdFormat =
  | "BANNER_HORIZONTAL"  // Leaderboard (728x90 desktop, 320x50/300x100 mobile)
  | "RECTANGLE_MEDIUM"   // MPU (300x250)
  | "RESPONSIVE"         // Fluid responsive container
  | "SPONSORED_CARD";    // Custom card layout for affiliate / direct sponsors

export type AdProviderType =
  | "ADSENSE"
  | "DIRECT_SPONSOR"
  | "AFFILIATE"
  | "TEST_PLACEHOLDER";

export type AdDeviceTarget = "ALL" | "MOBILE" | "DESKTOP";

export type ConsentStatus = "accepted" | "rejected" | "unknown";

export interface AdDimensions {
  minHeight: number; // In pixels, to prevent Cumulative Layout Shift (CLS)
  maxWidth?: number; // In pixels
  aspectRatio?: string;
}

export interface AdPlacementConfig {
  key: string;
  name: string;
  description?: string;
  pageType: AdPageType;
  location: string;
  format: AdFormat;
  enabled: boolean;
  provider: AdProviderType;
  slotId?: string;
  priority?: number;
  device?: AdDeviceTarget;
}

export interface IAdProvider {
  getProviderName(): string;
  renderSlot(props: {
    placement: AdPlacementConfig;
    dimensions: AdDimensions;
    isTestMode: boolean;
    className?: string;
  }): React.ReactNode;
}

export interface AffiliateLinkRecord {
  id: string;
  slug: string;
  name: string;
  destinationUrl: string;
  provider?: string;
  campaign?: string;
  enabled: boolean;
  clickCount: number;
  disclosureRequired: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonetizationEventPayload {
  eventType: "AD_IMPRESSION" | "AD_CLICK" | "AFFILIATE_CLICK" | "SPONSORED_VIEW";
  placementKey?: string;
  affiliateSlug?: string;
}
