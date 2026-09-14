/**
 * lib/search-analytics.ts
 * ────────────────────────────────────────────────────────────────
 * Privacy-safe, zero-PII search telemetry and analytics interface.
 *
 * Prepared for plug-and-play integration with:
 *   - Google Analytics 4 (gtag)
 *   - Plausible / PostHog
 *   - Custom server endpoint / telemetry logger
 *
 * Does NOT collect personal info, IP addresses, or tracking cookies.
 */

import { trackEvent } from "@/lib/analytics/tracker";

export type SearchAnalyticsEventType =
  | "search_query"
  | "search_result_click"
  | "search_filter_change"
  | "search_zero_results"
  | "search_suggestion_click";

export interface SearchQueryEvent {
  type: "search_query";
  query: string;
  resultCount: number;
  section: string;
  timestamp: number;
}

export interface SearchResultClickEvent {
  type: "search_result_click";
  query: string;
  resultId: string;
  resultType: "game" | "tool" | "app" | "guide";
  resultTitle: string;
  position: number;
  timestamp: number;
}

export interface SearchFilterChangeEvent {
  type: "search_filter_change";
  filterName: string;
  filterValue: string;
  query: string;
  timestamp: number;
}

export interface SearchZeroResultsEvent {
  type: "search_zero_results";
  query: string;
  suggestedAlternative?: string;
  timestamp: number;
}

export interface SearchSuggestionClickEvent {
  type: "search_suggestion_click";
  suggestion: string;
  source: "empty_state" | "did_you_mean" | "recent";
  timestamp: number;
}

export type SearchAnalyticsEvent =
  | SearchQueryEvent
  | SearchResultClickEvent
  | SearchFilterChangeEvent
  | SearchZeroResultsEvent
  | SearchSuggestionClickEvent;

type AnalyticsListener = (event: SearchAnalyticsEvent) => void;

const listeners = new Set<AnalyticsListener>();

/**
 * Register a listener for search analytics events.
 * Returns an unregister cleanup function.
 */
export function registerSearchAnalyticsListener(listener: AnalyticsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Dispatch a privacy-safe search analytics event.
 */
export function trackSearchEvent(event: SearchAnalyticsEvent): void {
  if (typeof window === "undefined") return;

  // Broadcast to in-app listeners
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // Ignore listener error
    }
  });

  // If window.gtag exists (GA4), push custom event
  const win = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof win.gtag === "function") {
    try {
      win.gtag("event", event.type, {
        event_category: "search",
        ...event,
      });
    } catch {
      // Ignore
    }
  }

  // Bridge to unified Phase 14 Analytics pipeline
  try {
    if (event.type === "search_query") {
      trackEvent({
        eventName: "SEARCH_SUBMIT",
        category: "search",
        metadata: { query: event.query, resultCount: event.resultCount, section: event.section },
      });
    } else if (event.type === "search_result_click") {
      trackEvent({
        eventName: "SEARCH_RESULT_CLICK",
        category: "search",
        contentType: event.resultType,
        contentSlug: event.resultId,
        metadata: { query: event.query, position: event.position, title: event.resultTitle },
      });
    } else if (event.type === "search_zero_results") {
      trackEvent({
        eventName: "SEARCH_ZERO_RESULTS",
        category: "search",
        metadata: { query: event.query, suggestedAlternative: event.suggestedAlternative },
      });
    } else if (event.type === "search_filter_change") {
      trackEvent({
        eventName: "SEARCH_FILTER_CHANGE",
        category: "search",
        metadata: { filterName: event.filterName, filterValue: event.filterValue, query: event.query },
      });
    }
  } catch {
    // Ignore bridge errors in test / isolated runtimes
  }

  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.debug("[SearchAnalytics]", event.type, event);
  }
}

