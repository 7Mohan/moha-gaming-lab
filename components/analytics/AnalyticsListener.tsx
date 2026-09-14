"use client";

/**
 * components/analytics/AnalyticsListener.tsx
 * ────────────────────────────────────────────────────────────────
 * Client component tracking SPA route transitions (PAGE_VIEW)
 * and extracting campaign attribution parameters (UTMs) safely.
 */

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics/tracker";

const ATTRIBUTION_KEY = "mgl_utm_attribution";

function AnalyticsTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Capture UTM Campaign Attribution (stored in sessionStorage for anonymous download attribution)
  React.useEffect(() => {
    if (!searchParams) return;

    const utmSource = searchParams.get("utm_source");
    const utmMedium = searchParams.get("utm_medium");
    const utmCampaign = searchParams.get("utm_campaign");
    const utmTerm = searchParams.get("utm_term");
    const utmContent = searchParams.get("utm_content");

    if (utmSource || utmCampaign) {
      try {
        const attribution = {
          source: utmSource ? utmSource.slice(0, 50) : undefined,
          medium: utmMedium ? utmMedium.slice(0, 50) : undefined,
          campaign: utmCampaign ? utmCampaign.slice(0, 50) : undefined,
          term: utmTerm ? utmTerm.slice(0, 50) : undefined,
          content: utmContent ? utmContent.slice(0, 50) : undefined,
          capturedAt: Date.now(),
        };
        sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
      } catch {
        // Ignore storage restrictions
      }
    }
  }, [searchParams]);

  // 2. Track Pageviews on route change
  React.useEffect(() => {
    if (!pathname) return;
    // Don't track admin internal routes in public analytics
    if (pathname.startsWith("/admin")) return;

    trackPageView(pathname, typeof document !== "undefined" ? document.title : undefined);
  }, [pathname]);

  return null;
}

export function AnalyticsListener() {
  return (
    <React.Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </React.Suspense>
  );
}
