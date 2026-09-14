/**
 * lib/analytics/providers/ga4.ts
 * ────────────────────────────────────────────────────────────────
 * Optional Google Analytics 4 (gtag) provider adapter.
 * Only activates when NEXT_PUBLIC_GA_ID is set and visitor has accepted consent.
 */

import { BaseAnalyticsProvider } from "./base";
import type { AnalyticsEventPayload } from "../types";

export class GA4AnalyticsProvider extends BaseAnalyticsProvider {
  name = "ga4";

  private getGtag(): ((...args: unknown[]) => void) | null {
    if (typeof window === "undefined") return null;
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    return typeof win.gtag === "function" ? win.gtag : null;
  }

  trackEvent(event: AnalyticsEventPayload): void {
    const gtag = this.getGtag();
    if (!gtag) return;

    try {
      gtag("event", event.eventName.toLowerCase(), {
        event_category: event.category,
        content_type: event.contentType,
        content_slug: event.contentSlug,
        page_path: event.path,
        ...event.metadata,
      });
    } catch {
      // Ignore external analytics errors
    }
  }

  trackPageView(path: string, title?: string): void {
    const gtag = this.getGtag();
    if (!gtag) return;

    try {
      gtag("event", "page_view", {
        page_path: path,
        page_title: title,
      });
    } catch {
      // Ignore external analytics errors
    }
  }
}
