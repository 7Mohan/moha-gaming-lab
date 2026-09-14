/**
 * lib/analytics/consent.ts
 * ────────────────────────────────────────────────────────────────
 * Privacy-first consent evaluation for Phase 14 Analytics.
 * Integrates with the existing Moha Gaming Lab ConsentBanner.
 */

import { getStoredConsent, subscribeToConsentChanges } from "@/lib/monetization/consent";
import type { ConsentStatus } from "@/lib/monetization/types";
import type { EventCategory } from "./types";

export type AnalyticsConsentTier = "essential" | "analytics" | "advertising";

/**
 * Determines whether a given event category is permitted under current visitor consent.
 */
export function canTrackCategory(category: EventCategory): boolean {
  if (typeof window === "undefined") {
    return true; // Server-side telemetry for operational metrics
  }

  const consent = getStoredConsent();

  // 1. Errors and strictly functional telemetry are essential
  if (category === "errors") {
    return true;
  }

  // 2. Monetization & Ad events strictly require explicit 'accepted' consent
  if (category === "monetization") {
    return consent === "accepted";
  }

  // 3. Analytics (Page views, Search, Tools, Games, Downloads, Web Vitals):
  // Allowed if accepted, blocked if explicitly rejected. If unknown, we wait for banner interaction.
  if (consent === "rejected") {
    return false;
  }

  // If accepted, allow all non-ad analytics
  if (consent === "accepted") {
    return true;
  }

  // If unknown, allow zero-PII aggregate performance telemetry only
  return category === "web_vitals" || category === "downloads";
}

/**
 * Returns current consent status.
 */
export function getVisitorConsent(): ConsentStatus {
  return getStoredConsent();
}

/**
 * Listens for consent preference changes.
 */
export function onConsentChange(callback: (status: ConsentStatus) => void): () => void {
  return subscribeToConsentChanges(callback);
}
