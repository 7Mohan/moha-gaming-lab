/**
 * lib/analytics/providers/base.ts
 * ────────────────────────────────────────────────────────────────
 * Base abstraction for pluggable analytics providers in Moha Gaming Lab.
 */

import type { AnalyticsEventPayload, IAnalyticsProvider } from "../types";

export abstract class BaseAnalyticsProvider implements IAnalyticsProvider {
  abstract name: string;

  initialize(): void {
    // Optional setup in subclasses
  }

  abstract trackEvent(event: AnalyticsEventPayload): Promise<void> | void;

  abstract trackPageView(path: string, title?: string): Promise<void> | void;
}
