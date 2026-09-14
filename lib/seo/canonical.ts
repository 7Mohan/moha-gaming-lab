/**
 * lib/seo/canonical.ts
 * ────────────────────────────────────────────────────────────────
 * Canonical URL normalization engine for Moha Gaming Lab.
 * Enforces stable canonical tags, strips query parameters (UTMs, tracking),
 * normalizes trailing slashes, and maintains uniform site indexing.
 */

import { SITE } from "../metadata";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
  "_gl",
  "msclkid",
]);

/**
 * Normalizes a path or URL into a strict canonical URL.
 * Example: "/games/PUBG-MOBILE/?utm_source=tiktok" -> "https://mohagaminglab.com/games/pubg-mobile"
 */
export function buildCanonicalUrl(rawPathOrUrl: string = "/"): string {
  const baseUrl = SITE.url.replace(/\/+$/, "");

  if (!rawPathOrUrl || rawPathOrUrl === "/") {
    return baseUrl;
  }

  try {
    // If relative path, resolve against baseUrl
    const parsed = new URL(rawPathOrUrl, baseUrl);

    // 1. Lowercase pathname
    let cleanPath = parsed.pathname.toLowerCase();

    // 2. Remove trailing slash (unless root)
    if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
      cleanPath = cleanPath.slice(0, -1);
    }

    // 3. Strip tracking parameters while retaining legitimate content query params if any
    const searchParams = new URLSearchParams();
    parsed.searchParams.forEach((value, key) => {
      if (!TRACKING_PARAMS.has(key.toLowerCase())) {
        searchParams.set(key, value);
      }
    });

    const queryString = searchParams.toString();
    return `${baseUrl}${cleanPath}${queryString ? `?${queryString}` : ""}`;
  } catch {
    return `${baseUrl}/${rawPathOrUrl.replace(/^\/+/, "").toLowerCase()}`;
  }
}

/**
 * Strips UTM and advertising query parameters from an incoming pathname/search string.
 */
export function sanitizeRequestUrl(url: string): string {
  try {
    const parsed = new URL(url, SITE.url);
    TRACKING_PARAMS.forEach((param) => {
      parsed.searchParams.delete(param);
    });
    return parsed.pathname + (parsed.search ? parsed.search : "");
  } catch {
    return url;
  }
}
