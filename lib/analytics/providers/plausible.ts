/**
 * lib/analytics/providers/plausible.ts
 * ────────────────────────────────────────────────────────────────
 * Optional Plausible privacy-conscious analytics provider adapter.
 */

import { BaseAnalyticsProvider } from "./base";
import type { AnalyticsEventPayload } from "../types";

export class PlausibleAnalyticsProvider extends BaseAnalyticsProvider {
  name = "plausible";

  private getPlausible(): ((name: string, options?: { props?: Record<string, unknown> }) => void) | null {
    if (typeof window === "undefined") return null;
    const win = window as unknown as { plausible?: (name: string, options?: { props?: Record<string, unknown> }) => void };
    return typeof win.plausible === "function" ? win.plausible : null;
  }

  trackEvent(event: AnalyticsEventPayload): void {
    const plausible = this.getPlausible();
    if (!plausible) return;

    try {
      plausible(event.eventName, {
        props: {
          category: event.category,
          contentType: event.contentType,
          contentSlug: event.contentSlug,
          path: event.path,
          ...event.metadata,
        },
      });
    } catch {
      // Ignore external analytics errors
    }
  }

  trackPageView(path: string): void {
    const plausible = this.getPlausible();
    if (!plausible) return;

    try {
      plausible("pageview", {
        props: { path },
      });
    } catch {
      // Ignore external analytics errors
    }
  }
}
