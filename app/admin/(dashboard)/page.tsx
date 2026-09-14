import * as React from "react";
import Link from "next/link";
import { getAllGames } from "@/lib/services/game-service";
import { getAllApps } from "@/lib/services/app-service";
import { getAllTools } from "@/lib/services/tool-service";
import { getAllGuides } from "@/lib/services/guide-service";
import { getCategories } from "@/lib/services/category-service";
import { getAllTags } from "@/lib/services/tag-service";
import { getRecentAuditEntries } from "@/lib/admin/audit";
import { hasDatabaseUrl } from "@/lib/env";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [games, apps, tools, guides, categories, tags, auditLogs] =
    await Promise.all([
      getAllGames(),
      getAllApps(),
      getAllTools(),
      getAllGuides(),
      getCategories(),
      getAllTags(),
      getRecentAuditEntries(10),
    ]);

  // Game stats
  const publishedGames = games.filter((g) => g.status === "active").length;
  const draftGames = games.filter((g) => g.status === "draft").length;

  // App stats
  const publishedApps = apps.filter(
    (a) => a.status === "active" || a.status === "stable"
  ).length;
  const totalReleases = apps.reduce((sum, a) => sum + (a.releases?.length || 0), 0);

  // Unverified app releases
  const unverifiedReleases = apps.flatMap((app) =>
    (app.releases || [])
      .filter((r) => r.verificationStatus !== "verified")
      .map((release) => ({ app, release }))
  );

  // Guide stats
  const publishedGuides = guides.filter((g) => g.status === "published").length;
  const reviewGuides = guides.filter((g) => g.status === "review");
  const draftGuides = guides.filter((g) => g.status === "draft").length;

  // Total drafts requiring publication
  const totalDrafts = draftGames + apps.filter((a) => a.status === "coming-soon").length + draftGuides;

  const isDbConnected = hasDatabaseUrl();

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Command Control Hub
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
              CMS v1.0
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Global content state, publishing workflows, and system audit telemetry.
          </p>
        </div>

        {/* System Health Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isDbConnected ? "bg-emerald-400 animate-pulse" : "bg-cyan-400"
              }`}
            />
            <span className="text-text-secondary">
              Storage:{" "}
              <strong className="text-white">
                {isDbConnected ? "PostgreSQL Pool" : "Zero-Latency Static"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Games Card */}
        <div className="bg-[#0E131F] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-primary/40 transition-colors shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
              Games Library
            </span>
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">{games.length}</span>
            <span className="text-xs text-text-tertiary ml-2">titles</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400">{publishedGames} published</span>
            <span className="text-text-tertiary">{draftGames} drafts</span>
            <Link href="/admin/games" className="text-primary hover:underline">
              Manage →
            </Link>
          </div>
        </div>

        {/* Apps Card */}
        <div className="bg-[#0E131F] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-accent/40 transition-colors shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
              Apps & APKs
            </span>
            <span className="p-2 rounded-xl bg-accent/10 text-accent">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">{apps.length}</span>
            <span className="text-xs text-text-tertiary ml-2">packages</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400">{publishedApps} live</span>
            <span className="text-text-tertiary">{totalReleases} releases</span>
            <Link href="/admin/apps" className="text-accent hover:underline">
              Manage →
            </Link>
          </div>
        </div>

        {/* Guides Card */}
        <div className="bg-[#0E131F] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
              Guides & Tutorials
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">{guides.length}</span>
            <span className="text-xs text-text-tertiary ml-2">articles</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400">{publishedGuides} published</span>
            <span className="text-amber-400">{reviewGuides.length} in review</span>
            <Link href="/admin/guides" className="text-emerald-400 hover:underline">
              Manage →
            </Link>
          </div>
        </div>

        {/* Tools Card */}
        <div className="bg-[#0E131F] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-colors shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
              Diagnostic Tools
            </span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">{tools.length}</span>
            <span className="text-xs text-text-tertiary ml-2">suites</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400">{categories.length} categories</span>
            <span className="text-text-tertiary">{tags.length} tags</span>
            <Link href="/admin/tools" className="text-cyan-400 hover:underline">
              Manage →
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Attention Center (Flow 03) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
            Operational Attention Center
          </h2>
          <span className="text-[11px] font-mono text-text-tertiary">
            {reviewGuides.length + unverifiedReleases.length + totalDrafts} items requiring administrative attention
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Review Queue */}
          <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 shadow-lg shadow-black/20 space-y-3 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${reviewGuides.length > 0 ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                Editorial Review Queue
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {reviewGuides.length} Pending
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {reviewGuides.length > 0
                ? `${reviewGuides.length} technical guide(s) submitted by authors awaiting editorial sign-off or revision.`
                : "No pending submissions. All author guides are reviewed and published."}
            </p>
            <div className="pt-2 border-t border-white/5">
              <Link
                href="/admin/review"
                className="text-xs font-mono font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5"
              >
                <span>Process Review Queue</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Release Verification */}
          <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 shadow-lg shadow-black/20 space-y-3 hover:border-accent/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${unverifiedReleases.length > 0 ? "bg-sky-400 animate-pulse" : "bg-emerald-400"}`} />
                App APK Verification
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30">
                {unverifiedReleases.length} Unverified
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {unverifiedReleases.length > 0
                ? `${unverifiedReleases.length} release package(s) require recorded checksum verification basis.`
                : "All live application releases have recorded verification hashes."}
            </p>
            <div className="pt-2 border-t border-white/5">
              <Link
                href="/admin/apps"
                className="text-xs font-mono font-bold text-accent hover:text-white flex items-center gap-1.5"
              >
                <span>Inspect App Releases</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Unpublished Drafts */}
          <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 shadow-lg shadow-black/20 space-y-3 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Unpublished Drafts
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/10">
                {totalDrafts} Drafts
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {totalDrafts > 0
                ? `${draftGames} game profile(s) and ${draftGuides} guide draft(s) currently unlisted.`
                : "All content items across the catalog are currently live."}
            </p>
            <div className="pt-2 border-t border-white/5">
              <Link
                href="/admin/search"
                className="text-xs font-mono font-bold text-primary hover:underline flex items-center gap-1.5"
              >
                <span>Search All Content</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Review Queue & Quick Launch Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Review Queue (2 cols on lg) */}
        <div className="lg:col-span-2 bg-[#0E131F] rounded-2xl border border-white/10 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Editorial Review Queue
              </h2>
              {reviewGuides.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {reviewGuides.length} Pending
                </span>
              )}
            </div>
            <Link
              href="/admin/review"
              className="text-xs font-mono text-primary hover:underline"
            >
              View all →
            </Link>
          </div>

          {reviewGuides.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xs font-medium text-white">Review queue is clean!</p>
              <p className="text-[11px] text-text-tertiary">
                No articles or guides currently awaiting editor approval.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reviewGuides.map((guide) => (
                <div
                  key={guide.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {guide.title}
                      </span>
                      <StatusBadge status="REVIEW" size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-text-tertiary mt-1">
                      <span>By {guide.author?.name || "Author"}</span>
                      <span>•</span>
                      <span>{guide.readingTimeMinutes} min read</span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/guides/${guide.id}`}
                    className="py-1.5 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-mono font-medium transition-colors"
                  >
                    Review & Publish
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Launch Panel */}
        <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <h2 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <Link
              href="/admin/games/new"
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 text-xs text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium">Register New Game Profile</span>
              </div>
              <span className="text-text-tertiary group-hover:text-white font-mono">→</span>
            </Link>
            <Link
              href="/admin/apps/new"
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 text-xs text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="font-medium">Add Android APK Package</span>
              </div>
              <span className="text-text-tertiary group-hover:text-white font-mono">→</span>
            </Link>
            <Link
              href="/admin/guides/new"
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 text-xs text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-medium">Author New Guide</span>
              </div>
              <span className="text-text-tertiary group-hover:text-white font-mono">→</span>
            </Link>
            <Link
              href="/admin/downloads"
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 text-xs text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="font-medium">Verify Download Mirrors</span>
              </div>
              <span className="text-text-tertiary group-hover:text-white font-mono">→</span>
            </Link>
            <Link
              href="/admin/seo"
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 text-xs text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="font-medium">Audit SEO Metadata</span>
              </div>
              <span className="text-text-tertiary group-hover:text-white font-mono">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity / Audit Log Table */}
      <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Security & Operations Audit Trail
            </h2>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Live immutable log of administrative mutations and authentication events.
            </p>
          </div>
          <span className="text-xs font-mono text-text-tertiary">
            Showing last {auditLogs.length} events
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-tertiary font-mono">
            No audit records yet. Activity will be recorded here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-text-tertiary text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Target ID / Slug</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-text-secondary">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 text-text-tertiary">
                      {new Date(log.createdAt).toLocaleTimeString()} •{" "}
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-primary">{log.entityType}</td>
                    <td className="py-2.5 px-3 text-text-tertiary truncate max-w-xs">
                      {log.entitySlug || log.entityId || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
