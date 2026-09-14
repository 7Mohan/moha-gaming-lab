/**
 * lib/analytics/service.ts
 * ────────────────────────────────────────────────────────────────
 * Server-side analytics data aggregator for Moha Gaming Lab Admin.
 * Queries PostgreSQL via Prisma and computes REAL metrics.
 * Strictly adheres to the Real Data Principle: NO fake numbers.
 */

import { hasDatabaseUrl } from "@/lib/env";

export interface AnalyticsSummary {
  hasData: boolean;
  totalPageViews: number;
  totalEvents: number;
  categoryBreakdown: { category: string; count: number }[];
  topPaths: { path: string; count: number }[];
  topSearches: { query: string; count: number; zeroResults: boolean }[];
  zeroResultSearches: { query: string; count: number }[];
  toolUsage: { toolSlug: string; starts: number; completes: number; errors: number }[];
  downloadStats: { appSlug: string; starts: number; completions: number }[];
  monetization: { impressions: number; clicks: number; affiliateClicks: number };
  webVitals: {
    cls: { good: number; needsImprovement: number; poor: number };
    lcp: { good: number; needsImprovement: number; poor: number };
    inp: { good: number; needsImprovement: number; poor: number };
  };
  contentOpportunities: { term: string; reason: string; priority: "high" | "medium" }[];
  recentEvents: {
    id: string;
    eventName: string;
    category: string;
    path: string | null;
    contentSlug: string | null;
    createdAt: string;
  }[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const emptySummary: AnalyticsSummary = {
    hasData: false,
    totalPageViews: 0,
    totalEvents: 0,
    categoryBreakdown: [],
    topPaths: [],
    topSearches: [],
    zeroResultSearches: [],
    toolUsage: [],
    downloadStats: [],
    monetization: { impressions: 0, clicks: 0, affiliateClicks: 0 },
    webVitals: {
      cls: { good: 0, needsImprovement: 0, poor: 0 },
      lcp: { good: 0, needsImprovement: 0, poor: 0 },
      inp: { good: 0, needsImprovement: 0, poor: 0 },
    },
    contentOpportunities: [],
    recentEvents: [],
  };

  if (!hasDatabaseUrl()) {
    return emptySummary;
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");

    const totalEvents = await prisma.analyticsEvent.count();
    if (totalEvents === 0) {
      return emptySummary;
    }

    const totalPageViews = await prisma.analyticsEvent.count({
      where: { eventName: "PAGE_VIEW" },
    });

    // 1. Category Breakdown
    const categoriesGroup = await prisma.analyticsEvent.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
      take: 10,
    });

    const categoryBreakdown = categoriesGroup.map((c) => ({
      category: c.category,
      count: c._count.category,
    }));

    // 2. Top Paths
    const pathsGroup = await prisma.analyticsEvent.groupBy({
      by: ["path"],
      where: { eventName: "PAGE_VIEW", path: { not: null } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 8,
    });

    const topPaths = pathsGroup
      .filter((p) => p.path)
      .map((p) => ({
        path: p.path!,
        count: p._count.path,
      }));

    // 3. Search Telemetry
    const searchEvents = await prisma.analyticsEvent.findMany({
      where: { category: "search" },
      select: { eventName: true, metadata: true },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    const searchCounts = new Map<string, { count: number; zeroResults: boolean }>();
    const zeroResultsMap = new Map<string, number>();

    for (const s of searchEvents) {
      const meta = s.metadata as { query?: string; resultCount?: number } | null;
      if (meta?.query) {
        const q = meta.query.toLowerCase().trim();
        const isZero = s.eventName === "SEARCH_ZERO_RESULTS" || meta.resultCount === 0;

        const current = searchCounts.get(q) || { count: 0, zeroResults: false };
        current.count += 1;
        if (isZero) {
          current.zeroResults = true;
          zeroResultsMap.set(q, (zeroResultsMap.get(q) || 0) + 1);
        }
        searchCounts.set(q, current);
      }
    }

    const topSearches = Array.from(searchCounts.entries())
      .map(([query, data]) => ({ query, count: data.count, zeroResults: data.zeroResults }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const zeroResultSearches = Array.from(zeroResultsMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. Content Opportunities (Based on real zero-result searches)
    const contentOpportunities: AnalyticsSummary["contentOpportunities"] = zeroResultSearches
      .slice(0, 5)
      .map((item) => ({
        term: item.query,
        reason: `${item.count} visitor search${item.count > 1 ? "es" : ""} returned zero matching guides or tools.`,
        priority: item.count >= 3 ? "high" : "medium",
      }));

    // 5. Tool Usage
    const toolEvents = await prisma.analyticsEvent.findMany({
      where: { category: "tools", contentSlug: { not: null } },
      select: { eventName: true, contentSlug: true },
      take: 200,
    });

    const toolMap = new Map<string, { starts: number; completes: number; errors: number }>();
    for (const t of toolEvents) {
      if (!t.contentSlug) continue;
      const stats = toolMap.get(t.contentSlug) || { starts: 0, completes: 0, errors: 0 };
      if (t.eventName === "TOOL_START") stats.starts += 1;
      else if (t.eventName === "TOOL_COMPLETE") stats.completes += 1;
      else if (t.eventName === "TOOL_ERROR") stats.errors += 1;
      toolMap.set(t.contentSlug, stats);
    }

    const toolUsage = Array.from(toolMap.entries()).map(([toolSlug, stats]) => ({
      toolSlug,
      ...stats,
    }));

    // 6. Download Stats
    const downloadEvents = await prisma.analyticsEvent.findMany({
      where: { category: "downloads", contentSlug: { not: null } },
      select: { eventName: true, contentSlug: true },
      take: 200,
    });

    const dlMap = new Map<string, { starts: number; completions: number }>();
    for (const d of downloadEvents) {
      if (!d.contentSlug) continue;
      const stats = dlMap.get(d.contentSlug) || { starts: 0, completions: 0 };
      if (d.eventName === "DOWNLOAD_START") stats.starts += 1;
      else if (d.eventName === "DOWNLOAD_SUCCESS") stats.completions += 1;
      dlMap.set(d.contentSlug, stats);
    }

    const downloadStats = Array.from(dlMap.entries()).map(([appSlug, stats]) => ({
      appSlug,
      ...stats,
    }));

    // 7. Monetization Stats (linking Phase 13)
    const adImpressions = await prisma.analyticsEvent.count({
      where: { eventName: "AD_IMPRESSION" },
    });
    const adClicks = await prisma.analyticsEvent.count({
      where: { eventName: "AD_CLICK" },
    });
    const affiliateClicks = await prisma.analyticsEvent.count({
      where: { eventName: "AFFILIATE_CLICK" },
    });

    // 8. Web Vitals
    const vitalsEvents = await prisma.analyticsEvent.findMany({
      where: { eventName: "WEB_VITALS_METRIC" },
      select: { metadata: true },
      take: 150,
    });

    const webVitals = {
      cls: { good: 0, needsImprovement: 0, poor: 0 },
      lcp: { good: 0, needsImprovement: 0, poor: 0 },
      inp: { good: 0, needsImprovement: 0, poor: 0 },
    };

    for (const v of vitalsEvents) {
      const meta = v.metadata as { metricName?: string; rating?: string } | null;
      if (!meta?.metricName || !meta?.rating) continue;
      const metric = meta.metricName.toLowerCase() as "cls" | "lcp" | "inp";
      if (webVitals[metric]) {
        if (meta.rating === "good") webVitals[metric].good += 1;
        else if (meta.rating === "needs-improvement") webVitals[metric].needsImprovement += 1;
        else if (meta.rating === "poor") webVitals[metric].poor += 1;
      }
    }

    // 9. Recent Events
    const recent = await prisma.analyticsEvent.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        eventName: true,
        category: true,
        path: true,
        contentSlug: true,
        createdAt: true,
      },
    });

    const recentEvents = recent.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      hasData: true,
      totalPageViews,
      totalEvents,
      categoryBreakdown,
      topPaths,
      topSearches,
      zeroResultSearches,
      toolUsage,
      downloadStats,
      monetization: {
        impressions: adImpressions,
        clicks: adClicks,
        affiliateClicks,
      },
      webVitals,
      contentOpportunities,
      recentEvents,
    };
  } catch (err) {
    console.error("[AnalyticsService] Failed to load summary:", err);
    return emptySummary;
  }
}
