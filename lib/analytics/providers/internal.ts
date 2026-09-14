/**
 * lib/analytics/providers/internal.ts
 * ────────────────────────────────────────────────────────────────
 * Default first-party, privacy-preserving provider for Moha Gaming Lab.
 * Dispatches validated events to /api/analytics/events without third-party tracking.
 */

import { BaseAnalyticsProvider } from "./base";
import type { AnalyticsEventPayload } from "../types";

export class InternalAnalyticsProvider extends BaseAnalyticsProvider {
  name = "internal";

  async trackEvent(event: AnalyticsEventPayload): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const payload = JSON.stringify(event);

      // Prefer non-blocking navigator.sendBeacon
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        const ok = navigator.sendBeacon("/api/analytics/events", blob);
        if (ok) return;
      }

      // Fallback to fetch with keepalive
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    } catch {
      // Telemetry errors must never disrupt user experience or UI execution
    }
  }

  async trackPageView(path: string, title?: string): Promise<void> {
    await this.trackEvent({
      eventName: "PAGE_VIEW",
      category: "navigation",
      path,
      metadata: title ? { title } : undefined,
      timestamp: Date.now(),
    });
  }
}
