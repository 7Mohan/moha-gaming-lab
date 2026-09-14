"use client";

/**
 * components/admin/analytics/AnalyticsDashboardClient.tsx
 * ────────────────────────────────────────────────────────────────
 * Production Analytics & Growth Dashboard for Moha Gaming Lab Admin.
 * Strictly adheres to the Real Data Principle: NO fake charts, NO simulated traffic,
 * NO manufactured growth percentages. Clearly marks empty states when metrics have 0 data.
 */

import * as React from "react";
import type { AnalyticsSummary } from "@/lib/analytics/service";
import {
  Activity,
  Search,
  Wrench,
  Download,
  DollarSign,
  Gauge,
  Lightbulb,
  Clock,
} from "lucide-react";

export function AnalyticsDashboardClient({ data }: { data: AnalyticsSummary }) {
  const {
    hasData,
    totalPageViews,
    totalEvents,
    categoryBreakdown,
    topPaths,
    topSearches,
    toolUsage,
    downloadStats,
    monetization,
    webVitals,
    contentOpportunities,
    recentEvents,
  } = data;

  return (
    <div className="space-y-8">
      {/* Telemetry Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E131F] border border-white/10 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              hasData ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          <div>
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {hasData ? "Real-Time Telemetry: Active" : "Telemetry Standby: No Events Logged Yet"}
            </h2>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Strict Real Data Mode: Zero simulated traffic. Metrics update as visitors navigate, search, run tools, or download apps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 border border-white/10 text-text-secondary">
            Retention: 90 Days
          </span>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 border border-white/10 text-emerald-400">
            Privacy: Zero PII
          </span>
        </div>
      </div>

      {/* Top Level Metric Summary (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/10 shadow-lg shadow-black/20 space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-xs font-mono">Total Pageviews</span>
            <Activity size={15} className="text-primary" />
          </div>
          <p className="text-2xl font-mono font-black text-white">
            {totalPageViews > 0 ? totalPageViews.toLocaleString() : "0"}
          </p>
          <span className="text-[10px] font-mono text-text-tertiary block">
            {totalPageViews > 0 ? "Measured direct visits" : "No pageviews recorded yet"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/10 shadow-lg shadow-black/20 space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-xs font-mono">Download Starts</span>
            <Download size={15} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white">
            {downloadStats.reduce((acc, d) => acc + d.starts, 0).toLocaleString()}
          </p>
          <span className="text-[10px] font-mono text-text-tertiary block">
            APK & release deliveries
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/10 shadow-lg shadow-black/20 space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-xs font-mono">Search Queries</span>
            <Search size={15} className="text-amber-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white">
            {topSearches.reduce((acc, s) => acc + s.count, 0).toLocaleString()}
          </p>
          <span className="text-[10px] font-mono text-text-tertiary block">
            Global search interactions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/10 shadow-lg shadow-black/20 space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-xs font-mono">Total Telemetry Events</span>
            <Gauge size={15} className="text-purple-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white">
            {totalEvents > 0 ? totalEvents.toLocaleString() : "0"}
          </p>
          <span className="text-[10px] font-mono text-text-tertiary block">
            Validated pipeline events
          </span>
        </div>
      </div>

      {/* Row: Content Categories & Top Visited Paths */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-[#0E131F] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white">Traffic by Content Category</h3>
            <span className="text-xs font-mono text-text-tertiary">All-Time</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-text-tertiary">
              No category telemetry recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((item) => {
                const pct = totalEvents > 0 ? Math.round((item.count / totalEvents) * 100) : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white capitalize">{item.category}</span>
                      <span className="text-text-tertiary">
                        {item.count} events ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Visited Paths */}
        <div className="p-6 rounded-2xl bg-[#0E131F] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white">Top Visited Pages</h3>
            <span className="text-xs font-mono text-text-tertiary">Real Pageviews</span>
          </div>

          {topPaths.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-text-tertiary">
              No pageviews recorded yet. Visit public pages to generate real telemetry.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {topPaths.map((p) => (
                <div key={p.path} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-text-secondary truncate max-w-xs">{p.path}</span>
                  <span className="font-mono font-bold text-white">{p.count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row: Search Intelligence & Content Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Queries */}
        <div className="p-6 rounded-2xl bg-[#0E131F] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">Search Queries</h3>
            </div>
            <span className="text-xs font-mono text-text-tertiary">Recent Terms</span>
          </div>

          {topSearches.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-text-tertiary">
              No searches executed yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {topSearches.map((s) => (
                <div key={s.query} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-white">&ldquo;{s.query}&rdquo;</span>
                  <div className="flex items-center gap-2">
                    {s.zeroResults && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Zero Results
                      </span>
                    )}
                    <span className="font-mono text-text-tertiary">{s.count} searches</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Opportunities Engine */}
        <div className="p-6 rounded-2xl bg-[#0E131F] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-white">Content Opportunities</h3>
            </div>
            <span className="text-xs font-mono text-text-tertiary">Derived from Gaps</span>
          </div>

          {contentOpportunities.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-text-tertiary">
              No content gaps identified. When visitors search for topics that return zero results, recommendations appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {contentOpportunities.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#141A29] border border-white/5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Topic: &ldquo;{item.term}&rdquo;</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary uppercase font-bold">
                      {item.priority} priority
                    </span>
                  </div>
                  <p className="text-[11px] text-text-tertiary">{item.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row: Tool Usage & Core Web Vitals RUM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Performance */}
        <div className="p-6 rounded-2xl bg-[#0E131F] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Tool Diagnostic Runs</h3>
            </div>
            <span className="text-xs font-mono text-text-tertiary">Browser Tools</span>
          </div>

          {toolUsage.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-text-tertiary">
              No tool diagnostic runs recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {toolUsage.map((t) => (
                <div key={t.toolSlug} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-white capitalize">{t.toolSlug}</span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-text-secondary">{t.starts} views</span>
                    {t.errors > 0 && <span className="text-red-400">{t.errors} errors</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Core Web Vitals RUM */}
        <div className="p-6 rounded-2xl bg-[#0E131F] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Gauge size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-white">Core Web Vitals (Real User RUM)</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">Live Browser Telemetry</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* LCP */}
            <div className="p-3.5 rounded-xl bg-[#141A29] border border-white/5 space-y-1 text-center">
              <span className="text-xs font-mono text-text-tertiary block">LCP</span>
              <span className="text-sm font-mono font-bold text-white">
                {webVitals.lcp.good + webVitals.lcp.needsImprovement + webVitals.lcp.poor > 0
                  ? `${webVitals.lcp.good} Good`
                  : "Unavailable"}
              </span>
              <span className="text-[10px] text-emerald-400 block font-mono">Target: &lt;2.5s</span>
            </div>

            {/* CLS */}
            <div className="p-3.5 rounded-xl bg-[#141A29] border border-white/5 space-y-1 text-center">
              <span className="text-xs font-mono text-text-tertiary block">CLS</span>
              <span className="text-sm font-mono font-bold text-white">
                {webVitals.cls.good + webVitals.cls.needsImprovement + webVitals.cls.poor > 0
                  ? `${webVitals.cls.good} Good`
                  : "Unavailable"}
              </span>
              <span className="text-[10px] text-emerald-400 block font-mono">Target: &lt;0.1</span>
            </div>

            {/* INP */}
            <div className="p-3.5 rounded-xl bg-[#141A29] border border-white/5 space-y-1 text-center">
              <span className="text-xs font-mono text-text-tertiary block">INP</span>
              <span className="text-sm font-mono font-bold text-white">
                {webVitals.inp.good + webVitals.inp.needsImprovement + webVitals.inp.poor > 0
                  ? `${webVitals.inp.good} Good`
                  : "Unavailable"}
              </span>
              <span className="text-[10px] text-emerald-400 block font-mono">Target: &lt;200ms</span>
            </div>
          </div>

          <p className="text-[11px] text-text-tertiary leading-relaxed pt-1">
            Real User Monitoring (RUM) measurements recorded directly via Next.js Web Vitals API from real visitors.
          </p>
        </div>
      </div>

      {/* Row: Monetization & Live Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monetization Events */}
        <div className="p-6 rounded-2xl bg-[#0E131F] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Monetization & Ad Events (Phase 13)</h3>
            </div>
            <span className="text-xs font-mono text-text-tertiary">Direct Telemetry</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#141A29] border border-white/5 text-center space-y-1">
              <span className="text-xs font-mono text-text-tertiary block">Ad Impressions</span>
              <span className="text-base font-mono font-bold text-white">
                {monetization.impressions.toLocaleString()}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#141A29] border border-white/5 text-center space-y-1">
              <span className="text-xs font-mono text-text-tertiary block">Ad Clicks</span>
              <span className="text-base font-mono font-bold text-white">
                {monetization.clicks.toLocaleString()}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#141A29] border border-white/5 text-center space-y-1">
              <span className="text-xs font-mono text-text-tertiary block">Affiliate Clicks</span>
              <span className="text-base font-mono font-bold text-white">
                {monetization.affiliateClicks.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Live Event Stream */}
        <div className="p-6 rounded-2xl bg-[#0E131F] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-text-tertiary" />
              <h3 className="text-sm font-bold text-white">Recent Event Log</h3>
            </div>
            <span className="text-xs font-mono text-text-tertiary">Last 15 Events</span>
          </div>

          {recentEvents.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-text-tertiary">
              No recent events recorded.
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-48 overflow-y-auto custom-scrollbar">
              {recentEvents.map((ev) => (
                <div key={ev.id} className="py-2 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-primary font-bold">{ev.eventName}</span>
                    <span className="text-text-tertiary truncate">
                      {ev.path || ev.contentSlug || "—"}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-tertiary shrink-0 ml-2">
                    {new Date(ev.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
