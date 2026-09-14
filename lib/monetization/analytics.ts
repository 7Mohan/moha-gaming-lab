/**
 * lib/monetization/analytics.ts
 * ────────────────────────────────────────────────────────────────
 * Privacy-safe, zero-PII monetization event telemetry.
 * Tracks impressions and affiliate clicks without fingerprinting or tracking personal data.
 */

import type { MonetizationEventPayload } from "./types";

/**
 * Dispatches an anonymous monetization telemetry event (impression, click, or affiliate redirect).
 */
export async function trackMonetizationEvent(
  payload: MonetizationEventPayload
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const body = JSON.stringify({
      eventType: payload.eventType,
      placementKey: payload.placementKey,
      affiliateSlug: payload.affiliateSlug,
    });

    // Use navigator.sendBeacon when available for reliable dispatch without page blocking
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/monetization/events", blob);
      if (ok) return;
    }

    // Fallback to fetch with keepalive
    await fetch("/api/monetization/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Telemetry errors must never disrupt user experience or UI rendering
  }
}
