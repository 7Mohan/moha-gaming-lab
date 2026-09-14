/**
 * lib/analytics/types.ts
 * ────────────────────────────────────────────────────────────────
 * Centralized Typed Event Taxonomy and Provider Contracts
 * for Moha Gaming Lab — Phase 14 Analytics & Growth.
 */

export type NavigationEventType =
  | "PAGE_VIEW"
  | "NAVIGATION_CLICK"
  | "SEARCH_OPEN"
  | "SEARCH_SUBMIT"
  | "SEARCH_RESULT_CLICK"
  | "SEARCH_ZERO_RESULTS"
  | "SEARCH_FILTER_CHANGE";

export type GameEventType =
  | "GAME_VIEW"
  | "GAME_GUIDE_CLICK"
  | "GAME_TOOL_CLICK"
  | "GAME_APP_CLICK";

export type ToolEventType =
  | "TOOL_VIEW"
  | "TOOL_START"
  | "TOOL_COMPLETE"
  | "TOOL_ERROR";

export type AppEventType =
  | "APP_VIEW"
  | "APP_RELEASE_VIEW"
  | "APP_DOWNLOAD_START"
  | "APP_DOWNLOAD_COMPLETE"
  | "APP_SOURCE_CLICK";

export type GuideEventType =
  | "GUIDE_VIEW"
  | "GUIDE_SCROLL_DEPTH"
  | "GUIDE_RELATED_CONTENT_CLICK"
  | "GUIDE_CTA_CLICK";

export type DownloadEventType =
  | "DOWNLOAD_PAGE_VIEW"
  | "DOWNLOAD_START"
  | "DOWNLOAD_SUCCESS"
  | "DOWNLOAD_FAILURE";

export type WebVitalsEventType = "WEB_VITALS_METRIC";

export type ErrorEventType =
  | "TOOL_ERROR"
  | "DOWNLOAD_ERROR"
  | "SEARCH_ERROR"
  | "ROUTE_ERROR"
  | "WEBGL_ERROR"
  | "ANALYTICS_ERROR";

export type MonetizationEventType =
  | "AD_IMPRESSION"
  | "AD_CLICK"
  | "AFFILIATE_CLICK"
  | "SPONSORED_VIEW";

export type AnalyticsEventName =
  | NavigationEventType
  | GameEventType
  | ToolEventType
  | AppEventType
  | GuideEventType
  | DownloadEventType
  | WebVitalsEventType
  | ErrorEventType
  | MonetizationEventType;

export type EventCategory =
  | "navigation"
  | "games"
  | "tools"
  | "apps"
  | "guides"
  | "downloads"
  | "search"
  | "web_vitals"
  | "errors"
  | "monetization";

export type ContentType = "game" | "app" | "tool" | "guide";

export interface AnalyticsEventPayload {
  eventName: AnalyticsEventName;
  category: EventCategory;
  path?: string;
  contentType?: ContentType;
  contentSlug?: string;
  anonymousSessionId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
}

export interface WebVitalsMetric {
  id: string;
  name: "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
  navigationType?: string;
}

export interface SearchTelemetryData {
  query: string;
  resultCount: number;
  filterType?: string;
  position?: number;
  resultSlug?: string;
  resultType?: ContentType;
}

export interface DownloadTelemetryData {
  appSlug: string;
  version: string;
  sourceType: string;
  fileSizeBytes?: number;
  direct?: boolean;
}

export interface IAnalyticsProvider {
  name: string;
  initialize(): void;
  trackEvent(event: AnalyticsEventPayload): Promise<void> | void;
  trackPageView(path: string, title?: string): Promise<void> | void;
}
