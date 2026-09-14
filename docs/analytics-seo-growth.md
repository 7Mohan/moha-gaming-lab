# Phase 14: Analytics, SEO & Growth Infrastructure

## Architecture & System Overview

**Moha Gaming Lab** Phase 14 establishes a high-performance, privacy-respecting analytics telemetry pipeline and technical SEO suite.

---

## 1. Core Principles

1. **Real Data Only**:
   - Zero synthetic, simulated, or randomized metrics.
   - If telemetry is empty or pending, admin dashboards explicitly show "No data recorded yet" / "Unavailable".
2. **Zero PII & Privacy-First**:
   - No IP addresses, device serials, MAC addresses, or personal credentials stored.
   - Ephemeral session IDs (`sessionStorage`) expire upon tab close.
3. **Pluggable & Agnostic Telemetry**:
   - Provider abstraction (`IAnalyticsProvider`) with support for Internal Database ingestion, Google Analytics 4 (GA4), and Plausible.
4. **Consent-Aware**:
   - Integrated with Phase 13 consent preferences (`essential`, `analytics`, `advertising`).
5. **Technical SEO Best Practices**:
   - Automated trailing slash normalization (301).
   - Trailing-slash and lowercase canonical URL generation without tracking parameters.
   - Strict `noIndex` on internal search (`/search`).
   - Rich Schema.org structured data (`WebSite`, `VideoGame`, `SoftwareApplication`, `WebApplication`, `BreadcrumbList`).

---

## 2. Event Taxonomy (`lib/analytics/types.ts`)

| Category | Events | Purpose |
| :--- | :--- | :--- |
| **Navigation** | `PAGE_VIEW`, `NAVIGATION_CLICK` | Track site journey and page engagement |
| **Search** | `SEARCH_OPEN`, `SEARCH_SUBMIT`, `SEARCH_RESULT_CLICK`, `SEARCH_ZERO_RESULTS`, `SEARCH_FILTER_CHANGE` | Discover query trends, zero-result terms, and click CTR |
| **Games** | `GAME_VIEW`, `GAME_GUIDE_CLICK`, `GAME_TOOL_CLICK`, `GAME_APP_CLICK` | Measure title interest and cross-hub navigation |
| **Tools** | `TOOL_VIEW`, `TOOL_START`, `TOOL_COMPLETE`, `TOOL_ERROR` | Track client utility usage and error rates |
| **Apps** | `APP_VIEW`, `APP_RELEASE_VIEW`, `APP_DOWNLOAD_START`, `APP_DOWNLOAD_COMPLETE`, `APP_SOURCE_CLICK` | Measure application discovery and download funnel |
| **Guides** | `GUIDE_VIEW`, `GUIDE_SCROLL_DEPTH`, `GUIDE_RELATED_CONTENT_CLICK`, `GUIDE_CTA_CLICK` | Content engagement and guide completion |
| **Downloads** | `DOWNLOAD_PAGE_VIEW`, `DOWNLOAD_START`, `DOWNLOAD_SUCCESS`, `DOWNLOAD_FAILURE` | Full download pipeline reliability and funnel conversion |
| **Web Vitals** | `WEB_VITALS_METRIC` | RUM telemetry (CLS, LCP, INP, FCP, TTFB) |
| **Monetization**| `AD_IMPRESSION`, `AD_CLICK`, `AFFILIATE_CLICK`, `SPONSORED_VIEW` | Phase 13 ad unit and partner link monitoring |
| **Errors** | `DOWNLOAD_ERROR`, `SEARCH_ERROR`, `ROUTE_ERROR`, `WEBGL_ERROR`, `ANALYTICS_ERROR` | System diagnostics and resilience monitoring |

---

## 3. Database Schema & Migration

### Models Added to `prisma/schema.prisma`

- **`AnalyticsEvent`**:
  - `id`: CUID
  - `eventName`: String (indexed)
  - `category`: String (indexed)
  - `path`: String?
  - `contentType`: String?
  - `contentSlug`: String?
  - `anonymousSessionId`: String? (indexed)
  - `metadata`: Json?
  - `createdAt`: DateTime (indexed)

- **`Redirect`**:
  - `id`: CUID
  - `sourcePath`: String (unique)
  - `targetPath`: String
  - `statusCode`: Int (301 / 302 / 307 / 308)
  - `enabled`: Boolean
  - `hitCount`: Int
  - `lastHitAt`: DateTime?

- **`Campaign`**:
  - `id`: CUID
  - `slug`: String (unique)
  - `name`: String
  - `source`: String
  - `medium`: String
  - `campaign`: String
  - `targetUrl`: String
  - `clickCount`: Int
  - `enabled`: Boolean

Migration file: `supabase/migrations/20260911_phase14_analytics_seo.sql`

---

## 4. Technical SEO Implementation

### Canonicalization (`lib/seo/canonical.ts`)
- Automatically generates canonical URLs pointing to `https://mohagaminglab.com`.
- Removes trailing slashes for non-root routes.
- Lowers case across all URL path segments.
- Strips invasive marketing tags (`utm_*`, `fbclid`, `gclid`, `_gl`, `msclkid`) while preserving core functional query parameters.

### Robots & Sitemap
- Dynamic `app/robots.ts` disallows `/admin/`, `/auth/`, `/api/`, and `/search`.
- Dynamic `app/sitemap.ts` includes all published Games, Apps, Tools, Guides, and `/privacy`, while strictly excluding search result listings to protect crawl budget.

### JSON-LD Structured Data (`lib/seo/structured-data.ts`)
- Injected on detail pages via standard `<script type="application/ld+json">`:
  - `VideoGame`: Name, genres, platforms, ratings.
  - `SoftwareApplication`: Verified version, platform, license, developer details.
  - `WebApplication`: Operating system, category, feature set.
  - `BreadcrumbList`: Crawl paths reflecting the current page hierarchy.

---

## 5. Admin Growth & Analytics Dashboard

Located at `/admin/analytics`:
- **Real-Time KPIs**: Total events, unique sessions, downloads initiated, and search volume.
- **Top Content Breakdown**: Real pageviews and interactions per slug.
- **Search Trends**: Highest volume terms and zero-result queries (revealing content demand gaps).
- **Core Web Vitals RUM**: Real user performance metrics across LCP, FID/INP, and CLS.
- **Redirects & SEO Auditor**: In `/admin/seo`, manage 301 rules and run real-time metadata validation checks.
