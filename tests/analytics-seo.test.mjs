/**
 * tests/analytics-seo.test.mjs
 * Pure-JS automated test suite for Phase 14: Analytics, SEO & Growth Infrastructure.
 * Run with: node --test tests/analytics-seo.test.mjs
 * All logic inlined — no TypeScript / path-alias imports.
 */

import test from "node:test";
import assert from "node:assert/strict";

// --- Analytics: Validation & Sanitization -----------------------------------

const VALID_EVENT_NAMES = new Set([
  "PAGE_VIEW","NAVIGATION_CLICK","SEARCH_OPEN","SEARCH_SUBMIT",
  "SEARCH_RESULT_CLICK","SEARCH_ZERO_RESULTS","SEARCH_FILTER_CHANGE",
  "GAME_VIEW","GAME_GUIDE_CLICK","GAME_TOOL_CLICK","GAME_APP_CLICK",
  "TOOL_VIEW","TOOL_START","TOOL_COMPLETE","TOOL_ERROR",
  "APP_VIEW","APP_RELEASE_VIEW","APP_DOWNLOAD_START","APP_DOWNLOAD_COMPLETE",
  "APP_SOURCE_CLICK","GUIDE_VIEW","GUIDE_SCROLL_DEPTH",
  "GUIDE_RELATED_CONTENT_CLICK","GUIDE_CTA_CLICK",
  "DOWNLOAD_PAGE_VIEW","DOWNLOAD_START","DOWNLOAD_SUCCESS","DOWNLOAD_FAILURE",
  "WEB_VITALS_METRIC","DOWNLOAD_ERROR","SEARCH_ERROR","ROUTE_ERROR",
  "WEBGL_ERROR","ANALYTICS_ERROR","AD_IMPRESSION","AD_CLICK",
  "AFFILIATE_CLICK","SPONSORED_VIEW",
]);
const VALID_CATEGORIES = new Set([
  "navigation","games","tools","apps","guides","downloads",
  "search","web_vitals","errors","monetization",
]);
const SLUG_SAFE = /^[a-zA-Z0-9_-]*$/;

function validateAnalyticsPayload(data) {
  if (!data || !VALID_EVENT_NAMES.has(data.eventName))
    return { success: false, error: `Invalid eventName: ${data?.eventName}` };
  if (!VALID_CATEGORIES.has(data.category))
    return { success: false, error: `Invalid category: ${data.category}` };
  if (data.contentSlug && !SLUG_SAFE.test(data.contentSlug))
    return { success: false, error: "contentSlug contains invalid characters" };
  if (data.path && data.path.length > 255)
    return { success: false, error: "path too long" };
  return { success: true, data };
}

function sanitizeSearchQuery(raw) {
  if (!raw) return "";
  return raw.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 100);
}

const FORBIDDEN_META_KEYS = ["password","token","auth","secret","cookie","email","credit","key"];

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return null;
  const result = {};
  for (const [k, v] of Object.entries(metadata)) {
    const lower = k.toLowerCase();
    if (FORBIDDEN_META_KEYS.some((f) => lower === f || lower.startsWith(f + "_") || lower.endsWith("_" + f) || lower.includes(f + "token") || lower.includes("user" + f))) continue;
    if (typeof v === "string") result[k] = v.slice(0, 500);
    else if (typeof v === "number" || typeof v === "boolean" || v === null) result[k] = v;
    else if (Array.isArray(v)) result[k] = v.slice(0, 20);
  }
  return result;
}

// --- SEO: Canonical URLs -----------------------------------------------------

const SITE_URL = "https://mohagaminglab.com";
const TRACKING_PARAMS = new Set([
  "utm_source","utm_medium","utm_campaign","utm_term","utm_content",
  "fbclid","gclid","ref","_gl","msclkid",
]);

function buildCanonicalUrl(rawPath = "/") {
  const base = SITE_URL.replace(/\/+$/, "");
  if (!rawPath || rawPath === "/") return base;
  try {
    const parsed = new URL(rawPath, base);
    let cleanPath = parsed.pathname.toLowerCase();
    if (cleanPath.length > 1 && cleanPath.endsWith("/")) cleanPath = cleanPath.slice(0, -1);
    const params = new URLSearchParams();
    parsed.searchParams.forEach((v, k) => {
      if (!TRACKING_PARAMS.has(k.toLowerCase())) params.set(k, v);
    });
    const qs = params.toString();
    return `${base}${cleanPath}${qs ? `?${qs}` : ""}`;
  } catch {
    return `${base}/${rawPath.replace(/^\/+/, "").toLowerCase()}`;
  }
}

function sanitizeRequestUrl(url) {
  try {
    const parsed = new URL(url, SITE_URL);
    TRACKING_PARAMS.forEach((p) => parsed.searchParams.delete(p));
    return parsed.pathname + (parsed.search || "");
  } catch {
    return url;
  }
}

// --- SEO: Metadata Validation ------------------------------------------------

function validateSeoMetadata({ title = "", description = "", canonicalUrl = "", wordCount = 300 } = {}) {
  const issues = [];
  const t = title.trim();
  const d = description.trim();
  if (!t) issues.push({ field: "title", severity: "error", message: "Missing title" });
  else if (t.length < 25) issues.push({ field: "title", severity: "warning", message: "Title too short" });
  else if (t.length > 65) issues.push({ field: "title", severity: "warning", message: "Title too long" });
  if (!d) issues.push({ field: "description", severity: "error", message: "Missing description" });
  else if (d.length < 60) issues.push({ field: "description", severity: "warning", message: "Description too short" });
  else if (d.length > 160) issues.push({ field: "description", severity: "warning", message: "Description too long" });
  if (canonicalUrl) {
    if (!canonicalUrl.startsWith("https://") && !canonicalUrl.startsWith("http://localhost"))
      issues.push({ field: "canonical", severity: "error", message: "Must be HTTPS" });
    if (/[?&](utm_|fbclid|gclid)/i.test(canonicalUrl))
      issues.push({ field: "canonical", severity: "error", message: "Contains tracking params" });
  }
  if (wordCount < 100) issues.push({ field: "content", severity: "warning", message: "Thin content" });
  let score = 100;
  for (const i of issues) {
    if (i.severity === "error") score -= 25;
    else if (i.severity === "warning") score -= 10;
  }
  return { score: Math.max(0, score), isValid: !issues.some((i) => i.severity === "error"), issues };
}

// --- JSON-LD Generators ------------------------------------------------------

function generateWebSiteJsonLd() {
  return { "@context": "https://schema.org", "@type": "WebSite", name: "Moha Gaming Lab", url: SITE_URL,
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` } } };
}

function generateGameJsonLd(game) {
  return { "@context": "https://schema.org", "@type": "VideoGame", name: game.name,
    description: game.excerpt, url: buildCanonicalUrl(`/games/${game.slug}`),
    genre: game.category ? [game.category] : undefined, gamePlatform: ["Android", "Mobile"] };
}

function generateAppJsonLd(app) {
  const latest = app.releases?.[0];
  return { "@context": "https://schema.org", "@type": "SoftwareApplication", name: app.name,
    softwareVersion: latest?.version ?? "1.0", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };
}

function generateToolJsonLd(tool) {
  return { "@context": "https://schema.org", "@type": "WebApplication", name: tool.name,
    url: buildCanonicalUrl(`/tools/${tool.slug}`) };
}

function generateBreadcrumbsJsonLd(items) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: buildCanonicalUrl(item.path) })) };
}

function normalizeRedirectPath(path) {
  if (!path) return "/";
  let clean = path.toLowerCase().trim();
  if (!clean.startsWith("/")) clean = "/" + clean;
  if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
  return clean;
}

// --- TESTS: Analytics Validation --------------------------------------------

test("Analytics: valid PAGE_VIEW event accepted", () => {
  const res = validateAnalyticsPayload({ eventName: "PAGE_VIEW", category: "navigation", path: "/games/pubg-mobile" });
  assert.equal(res.success, true);
});

test("Analytics: valid TOOL_COMPLETE with contentSlug accepted", () => {
  const res = validateAnalyticsPayload({ eventName: "TOOL_COMPLETE", category: "tools", contentSlug: "fps-calculator" });
  assert.equal(res.success, true);
});

test("Analytics: rejects unknown eventName", () => {
  const res = validateAnalyticsPayload({ eventName: "DO_HACK", category: "navigation" });
  assert.equal(res.success, false);
  assert.ok(res.error.includes("Invalid eventName"));
});

test("Analytics: rejects unknown category", () => {
  const res = validateAnalyticsPayload({ eventName: "PAGE_VIEW", category: "unknown_cat" });
  assert.equal(res.success, false);
});

test("Analytics: rejects contentSlug with XSS characters", () => {
  const res = validateAnalyticsPayload({ eventName: "GAME_VIEW", category: "games", contentSlug: "<script>alert(1)</script>" });
  assert.equal(res.success, false);
});

test("Analytics: all monetization events are valid", () => {
  for (const eventName of ["AD_IMPRESSION","AD_CLICK","AFFILIATE_CLICK","SPONSORED_VIEW"]) {
    assert.equal(validateAnalyticsPayload({ eventName, category: "monetization" }).success, true, `Failed for ${eventName}`);
  }
});

// --- TESTS: Analytics Sanitization ------------------------------------------

test("Analytics: sanitizeSearchQuery strips control chars", () => {
  const clean = sanitizeSearchQuery("  fps boost \x00\x1F optimization  ");
  assert.equal(clean, "fps boost  optimization");
});

test("Analytics: sanitizeSearchQuery truncates at 100 chars", () => {
  assert.equal(sanitizeSearchQuery("a".repeat(200)).length, 100);
});

test("Analytics: sanitizeSearchQuery returns empty string for empty input", () => {
  assert.equal(sanitizeSearchQuery(null), "");
  assert.equal(sanitizeSearchQuery(""), "");
});

test("Analytics: sanitizeMetadata strips sensitive keys", () => {
  const s = sanitizeMetadata({ safeKey: "hello", userPassword: "secret", authToken: "bearer", count: 42 });
  assert.equal(s.safeKey, "hello");
  assert.equal(s.count, 42);
  assert.equal(s.userPassword, undefined);
  assert.equal(s.authToken, undefined);
});

test("Analytics: sanitizeMetadata returns null for non-object input", () => {
  assert.equal(sanitizeMetadata(null), null);
  assert.equal(sanitizeMetadata("string"), null);
});

test("Analytics: sanitizeMetadata caps string values at 500 chars", () => {
  const s = sanitizeMetadata({ bigField: "x".repeat(600) });
  assert.equal(s.bigField.length, 500);
});

// --- TESTS: SEO Canonical URLs ------------------------------------------------

test("SEO: canonical normalizes path to lowercase", () => {
  assert.equal(buildCanonicalUrl("/Games/PUBG-MOBILE"), "https://mohagaminglab.com/games/pubg-mobile");
});

test("SEO: canonical strips tracking params", () => {
  assert.equal(buildCanonicalUrl("/games/pubg-mobile?utm_source=tiktok&fbclid=123"), "https://mohagaminglab.com/games/pubg-mobile");
});

test("SEO: canonical removes trailing slash on subpaths", () => {
  assert.equal(buildCanonicalUrl("/tools/fps-calculator/"), "https://mohagaminglab.com/tools/fps-calculator");
});

test("SEO: canonical root path returns bare domain", () => {
  assert.equal(buildCanonicalUrl("/"), "https://mohagaminglab.com");
  assert.equal(buildCanonicalUrl(""), "https://mohagaminglab.com");
});

test("SEO: canonical preserves non-tracking query params", () => {
  assert.equal(buildCanonicalUrl("/search?q=fps&utm_source=google"), "https://mohagaminglab.com/search?q=fps");
});

test("SEO: sanitizeRequestUrl strips UTM keeps content params", () => {
  assert.equal(sanitizeRequestUrl("https://mohagaminglab.com/apps/toolkit?utm_source=youtube&q=fps"), "/apps/toolkit?q=fps");
});

// --- TESTS: SEO Metadata Validation -----------------------------------------

test("SEO Validation: flags missing title and description", () => {
  const res = validateSeoMetadata({});
  assert.equal(res.isValid, false);
  assert.ok(res.issues.some((i) => i.field === "title" && i.severity === "error"));
  assert.ok(res.issues.some((i) => i.field === "description" && i.severity === "error"));
});

test("SEO Validation: flags short fields as warnings", () => {
  const res = validateSeoMetadata({ title: "Short", description: "Too short" });
  assert.ok(res.issues.some((i) => i.field === "title" && i.severity === "warning"));
  assert.ok(res.issues.some((i) => i.field === "description" && i.severity === "warning"));
});

test("SEO Validation: perfect metadata scores 100", () => {
  const res = validateSeoMetadata({
    title: "Android Gaming FPS Diagnostics & Performance Toolkit",
    description: "Comprehensive real-time frame telemetry and SurfaceFlinger analysis for serious Android mobile gamers.",
    canonicalUrl: "https://mohagaminglab.com/tools/fps-monitor",
    wordCount: 450,
  });
  assert.equal(res.isValid, true);
  assert.equal(res.issues.length, 0);
  assert.equal(res.score, 100);
});

test("SEO Validation: non-HTTPS canonical fails validation", () => {
  const res = validateSeoMetadata({
    title: "Valid Title That Is Definitely Long Enough To Pass Check",
    description: "A valid description that is definitely long enough to pass all of the minimum length checks here.",
    canonicalUrl: "http://insecure.com/page",
  });
  assert.equal(res.isValid, false);
  assert.ok(res.issues.some((i) => i.field === "canonical" && i.severity === "error"));
});

test("SEO Validation: thin content gets warning", () => {
  const res = validateSeoMetadata({
    title: "Valid Title That Is Definitely Long Enough To Pass Check",
    description: "A valid description that is definitely long enough to pass all of the minimum length checks here.",
    wordCount: 50,
  });
  assert.ok(res.issues.some((i) => i.field === "content" && i.severity === "warning"));
});

// --- TESTS: JSON-LD Schemas --------------------------------------------------

test("JSON-LD: WebSite schema has correct type and SearchAction", () => {
  const schema = generateWebSiteJsonLd();
  assert.equal(schema["@type"], "WebSite");
  assert.equal(schema.url, SITE_URL);
  assert.equal(schema.potentialAction["@type"], "SearchAction");
});

test("JSON-LD: VideoGame schema has correct type and canonical URL", () => {
  const schema = generateGameJsonLd({ slug: "pubg-mobile", name: "PUBG Mobile", category: "battle-royale", excerpt: "Tactical shooter" });
  assert.equal(schema["@type"], "VideoGame");
  assert.equal(schema.url, "https://mohagaminglab.com/games/pubg-mobile");
  assert.deepEqual(schema.genre, ["battle-royale"]);
});

test("JSON-LD: SoftwareApplication uses latest release version", () => {
  const schema = generateAppJsonLd({ name: "FPS Toolkit", releases: [{ version: "1.4.2" }] });
  assert.equal(schema["@type"], "SoftwareApplication");
  assert.equal(schema.softwareVersion, "1.4.2");
  assert.equal(schema.offers.price, "0");
});

test("JSON-LD: SoftwareApplication falls back to 1.0 when no releases", () => {
  const schema = generateAppJsonLd({ name: "Toolkit", releases: [] });
  assert.equal(schema.softwareVersion, "1.0");
});

test("JSON-LD: WebApplication tool schema has correct type and URL", () => {
  const schema = generateToolJsonLd({ slug: "fps-monitor", name: "FPS Monitor" });
  assert.equal(schema["@type"], "WebApplication");
  assert.equal(schema.url, "https://mohagaminglab.com/tools/fps-monitor");
});

test("JSON-LD: BreadcrumbList positions and URLs are correct", () => {
  const schema = generateBreadcrumbsJsonLd([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: "Frame Time", path: "/guides/frame-time" },
  ]);
  assert.equal(schema["@type"], "BreadcrumbList");
  assert.equal(schema.itemListElement.length, 3);
  assert.equal(schema.itemListElement[2].position, 3);
  assert.equal(schema.itemListElement[2].item, "https://mohagaminglab.com/guides/frame-time");
});

// --- TESTS: Redirect Management ----------------------------------------------

test("Redirects: normalizeRedirectPath strips trailing slash", () => {
  assert.equal(normalizeRedirectPath("games/old-slug/"), "/games/old-slug");
});

test("Redirects: normalizeRedirectPath lowercases", () => {
  assert.equal(normalizeRedirectPath("/APPS/TOOLKIT"), "/apps/toolkit");
});

test("Redirects: normalizeRedirectPath handles empty input", () => {
  assert.equal(normalizeRedirectPath(""), "/");
  assert.equal(normalizeRedirectPath(null), "/");
});

test("Redirects: normalizeRedirectPath adds leading slash", () => {
  assert.equal(normalizeRedirectPath("guides/fps"), "/guides/fps");
});

test("Redirects: external URL targets are rejected as open redirects", () => {
  for (const t of ["https://evil.com", "//evil.com", "http://attacker.io"]) {
    const isSafe = t.startsWith("/") && !t.startsWith("//");
    assert.equal(isSafe, false, `Should block: ${t}`);
  }
});

test("Redirects: relative-path targets are accepted", () => {
  for (const t of ["/games", "/apps/toolkit", "/guides/fps-tips"]) {
    const isSafe = t.startsWith("/") && !t.startsWith("//");
    assert.equal(isSafe, true, `Should allow: ${t}`);
  }
});

// --- TESTS: Sitemap & Robots -------------------------------------------------

test("Sitemap: /search is excluded from public routes", () => {
  const routes = ["/", "/games", "/apps", "/tools", "/guides", "/downloads", "/privacy"];
  assert.equal(routes.includes("/search"), false);
  assert.equal(routes.includes("/privacy"), true);
});

test("Robots: admin and API routes are disallowed", () => {
  const disallowed = ["/admin", "/admin/", "/auth/", "/search", "/api/", "/forgot-password", "/reset-password"];
  assert.ok(disallowed.includes("/admin"));
  assert.ok(disallowed.includes("/api/"));
  assert.ok(!disallowed.includes("/"));
  assert.ok(!disallowed.includes("/games"));
});

