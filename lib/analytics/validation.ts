/**
 * lib/analytics/validation.ts
 * ────────────────────────────────────────────────────────────────
 * Strict Zod validation schemas for all Phase 14 Analytics events.
 * Defends against oversized payloads, injection, and invalid event types.
 */

import { z } from "zod";
import type { AnalyticsEventPayload } from "./types";

const ALL_EVENT_NAMES = [
  // Navigation
  "PAGE_VIEW",
  "NAVIGATION_CLICK",
  "SEARCH_OPEN",
  "SEARCH_SUBMIT",
  "SEARCH_RESULT_CLICK",
  "SEARCH_ZERO_RESULTS",
  "SEARCH_FILTER_CHANGE",
  // Games
  "GAME_VIEW",
  "GAME_GUIDE_CLICK",
  "GAME_TOOL_CLICK",
  "GAME_APP_CLICK",
  // Tools
  "TOOL_VIEW",
  "TOOL_START",
  "TOOL_COMPLETE",
  "TOOL_ERROR",
  // Apps
  "APP_VIEW",
  "APP_RELEASE_VIEW",
  "APP_DOWNLOAD_START",
  "APP_DOWNLOAD_COMPLETE",
  "APP_SOURCE_CLICK",
  // Guides
  "GUIDE_VIEW",
  "GUIDE_SCROLL_DEPTH",
  "GUIDE_RELATED_CONTENT_CLICK",
  "GUIDE_CTA_CLICK",
  // Downloads
  "DOWNLOAD_PAGE_VIEW",
  "DOWNLOAD_START",
  "DOWNLOAD_SUCCESS",
  "DOWNLOAD_FAILURE",
  // Web Vitals
  "WEB_VITALS_METRIC",
  // Errors
  "TOOL_ERROR",
  "DOWNLOAD_ERROR",
  "SEARCH_ERROR",
  "ROUTE_ERROR",
  "WEBGL_ERROR",
  "ANALYTICS_ERROR",
  // Monetization
  "AD_IMPRESSION",
  "AD_CLICK",
  "AFFILIATE_CLICK",
  "SPONSORED_VIEW",
] as const;

const ALL_CATEGORIES = [
  "navigation",
  "games",
  "tools",
  "apps",
  "guides",
  "downloads",
  "search",
  "web_vitals",
  "errors",
  "monetization",
] as const;

export const analyticsEventSchema = z.object({
  eventName: z.enum(ALL_EVENT_NAMES),
  category: z.enum(ALL_CATEGORIES),
  path: z.string().max(255).optional().nullable(),
  contentType: z.enum(["game", "app", "tool", "guide"]).optional().nullable(),
  contentSlug: z
    .string()
    .max(100)
    .regex(/^[a-zA-Z0-9_-]*$/, "Slug contains invalid characters")
    .optional()
    .nullable(),
  anonymousSessionId: z.string().max(64).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  timestamp: z.number().int().positive().optional(),
});

/**
 * Sanitizes and truncates a search query for privacy and safety.
 * Strips control characters, caps to 100 chars, trims whitespace.
 */
export function sanitizeSearchQuery(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/[\x00-\x1F\x7F]/g, "") // Strip ASCII control characters
    .trim()
    .slice(0, 100);
}

/**
 * Safely stringifies and bounds metadata to prevent database payload bloat.
 * Max 4096 bytes allowed. Strips any potential secret keys.
 */
export function sanitizeMetadata(metadata?: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object") return null;

  const forbiddenKeys = ["password", "token", "auth", "secret", "cookie", "email", "credit", "key"];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (forbiddenKeys.some((f) => lower.includes(f))) {
      continue; // Drop sensitive keys
    }

    if (typeof value === "string") {
      sanitized[key] = value.slice(0, 500); // Cap string values to 500 chars
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 20); // Cap array items
    }
  }

  const serialized = JSON.stringify(sanitized);
  if (serialized.length > 4096) {
    return { note: "metadata_truncated_for_size" };
  }

  return sanitized;
}

/**
 * Validates an incoming analytics event payload.
 */
export function validateAnalyticsPayload(
  data: unknown
): { success: true; data: AnalyticsEventPayload } | { success: false; error: string } {
  const result = analyticsEventSchema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues[0]?.message || "Invalid analytics event format";
    return { success: false, error: msg };
  }

  return {
    success: true,
    data: {
      ...result.data,
      path: result.data.path || undefined,
      contentType: result.data.contentType || undefined,
      contentSlug: result.data.contentSlug || undefined,
      anonymousSessionId: result.data.anonymousSessionId || undefined,
      metadata: sanitizeMetadata(result.data.metadata) || undefined,
    } as AnalyticsEventPayload,
  };
}
