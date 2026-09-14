/**
 * lib/analytics/tracker.ts
 * ────────────────────────────────────────────────────────────────
 * Centralized Client-Side Analytics Tracker for Moha Gaming Lab.
 * Manages provider dispatching, consent enforcement, React 18 deduplication,
 * and zero-PII ephemeral session tracking.
 */

import type {
  AnalyticsEventPayload,
  IAnalyticsProvider,
  WebVitalsMetric,
  ErrorEventType,
} from "./types";
import { canTrackCategory } from "./consent";
import { validateAnalyticsPayload, sanitizeSearchQuery } from "./validation";
import { InternalAnalyticsProvider } from "./providers/internal";
import { GA4AnalyticsProvider } from "./providers/ga4";
import { PlausibleAnalyticsProvider } from "./providers/plausible";

const SESSION_KEY = "mgl_anon_session";
const DEDUP_WINDOW_MS = 1500;

// In-memory deduplication cache for React StrictMode / rapid multi-triggers
const recentEventCache = new Map<string, number>();

/**
 * Returns an ephemeral session ID stored strictly in sessionStorage.
 * Cleared automatically when tab is closed. No device or user fingerprinting.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "server";

  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = "s_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "ephemeral";
  }
}

/**
 * Registered providers list.
 */
const providers: IAnalyticsProvider[] = [
  new InternalAnalyticsProvider(),
  new GA4AnalyticsProvider(),
  new PlausibleAnalyticsProvider(),
];

/**
 * Dispatches an event through the validated, consent-checked analytics pipeline.
 */
export async function trackEvent(
  rawEvent: Omit<AnalyticsEventPayload, "anonymousSessionId" | "timestamp">
): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. Check Consent
  if (!canTrackCategory(rawEvent.category)) {
    return;
  }

  // 2. Deduplication check
  const dedupKey = `${rawEvent.eventName}:${rawEvent.contentSlug || ""}:${rawEvent.path || window.location.pathname}`;
  const now = Date.now();
  const lastTime = recentEventCache.get(dedupKey);

  if (lastTime && now - lastTime < DEDUP_WINDOW_MS) {
    return; // Drop duplicate event
  }
  recentEventCache.set(dedupKey, now);

  // Clean old dedup entries periodically
  if (recentEventCache.size > 100) {
    for (const [key, timestamp] of recentEventCache.entries()) {
      if (now - timestamp > DEDUP_WINDOW_MS * 4) {
        recentEventCache.delete(key);
      }
    }
  }

  // 3. Assemble and Validate Payload
  const fullPayload = {
    ...rawEvent,
    path: rawEvent.path || window.location.pathname,
    anonymousSessionId: getAnonymousSessionId(),
    timestamp: now,
  };

  const validation = validateAnalyticsPayload(fullPayload);
  if (!validation.success) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Analytics] Event validation failed:", validation.error, fullPayload);
    }
    return;
  }

  const validEvent = validation.data;

  // 4. Dispatch to All Enabled Providers
  for (const provider of providers) {
    try {
      provider.trackEvent(validEvent);
    } catch {
      // Individual provider failure must never crash the tracker
    }
  }
}

// ────────────────────────────────────────────────────────────────
// Domain-Specific Helper Methods
// ────────────────────────────────────────────────────────────────

export function trackPageView(path?: string, title?: string): void {
  const currentPath = path || (typeof window !== "undefined" ? window.location.pathname : "/");
  trackEvent({
    eventName: "PAGE_VIEW",
    category: "navigation",
    path: currentPath,
    metadata: title ? { title } : undefined,
  });
}

export function trackGameEvent(
  eventName: "GAME_VIEW" | "GAME_GUIDE_CLICK" | "GAME_TOOL_CLICK" | "GAME_APP_CLICK",
  gameSlug: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventName,
    category: "games",
    contentType: "game",
    contentSlug: gameSlug,
    metadata,
  });
}

export function trackToolEvent(
  eventName: "TOOL_VIEW" | "TOOL_START" | "TOOL_COMPLETE" | "TOOL_ERROR",
  toolSlug: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventName,
    category: "tools",
    contentType: "tool",
    contentSlug: toolSlug,
    metadata,
  });
}

export function trackAppEvent(
  eventName: "APP_VIEW" | "APP_RELEASE_VIEW" | "APP_DOWNLOAD_START" | "APP_DOWNLOAD_COMPLETE" | "APP_SOURCE_CLICK",
  appSlug: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventName,
    category: "apps",
    contentType: "app",
    contentSlug: appSlug,
    metadata,
  });
}

export function trackGuideEvent(
  eventName: "GUIDE_VIEW" | "GUIDE_SCROLL_DEPTH" | "GUIDE_RELATED_CONTENT_CLICK" | "GUIDE_CTA_CLICK",
  guideSlug: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventName,
    category: "guides",
    contentType: "guide",
    contentSlug: guideSlug,
    metadata,
  });
}

export function trackSearchEvent(
  eventName: "SEARCH_SUBMIT" | "SEARCH_RESULT_CLICK" | "SEARCH_ZERO_RESULTS" | "SEARCH_FILTER_CHANGE",
  query: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventName,
    category: "search",
    metadata: {
      query: sanitizeSearchQuery(query),
      ...metadata,
    },
  });
}

export function trackDownloadEvent(
  eventName: "DOWNLOAD_PAGE_VIEW" | "DOWNLOAD_START" | "DOWNLOAD_SUCCESS" | "DOWNLOAD_FAILURE",
  appSlug: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventName,
    category: "downloads",
    contentType: "app",
    contentSlug: appSlug,
    metadata,
  });
}

export function trackWebVitalsMetric(metric: WebVitalsMetric): void {
  trackEvent({
    eventName: "WEB_VITALS_METRIC",
    category: "web_vitals",
    metadata: {
      metricName: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
    },
  });
}

export function trackErrorEvent(
  errorType: ErrorEventType,
  message: string,
  context?: Record<string, unknown>
): void {
  trackEvent({
    eventName: errorType,
    category: "errors",
    metadata: {
      message: message.slice(0, 255),
      ...context,
    },
  });
}
