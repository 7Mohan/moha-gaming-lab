import { notFound } from "next/navigation";
import Link from "next/link";
import { getGameBySlug, getAllGameSlugs } from "@/lib/services/game-service";
import { getToolBySlug } from "@/lib/services/tool-service";
import { getAppBySlug } from "@/lib/services/app-service";
import { getGuideBySlug } from "@/lib/services/guide-service";
import { buildMetadata } from "@/lib/metadata";
import { buildGameOgTitle, buildGameOgDescription } from "@/types/game";
import { Badge } from "@/components/ui/Badge";
import { AdSlot } from "@/components/monetization/AdSlot";
import { PERFORMANCE_AREA_LABELS, CATEGORY_LABELS } from "@/lib/games";
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  Gauge,
  Wifi,
  Zap,
  Thermometer,
  Battery,
  Monitor,
  HardDrive,
  TriangleAlert,
  ChevronRight,
  BookOpen,
  Wrench,
  Smartphone,
} from "lucide-react";
import type { PerformanceArea, OptimizationCategory } from "@/types/game";

import { generateGameJsonLd, generateBreadcrumbsJsonLd } from "@/lib/seo/structured-data";

/* ── Route config ─────────────────────────────────────────── */

interface Props {
  params: Promise<{ game: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllGameSlugs();
  return slugs.map((slug) => ({ game: slug }));
}

export async function generateMetadata({ params }: Props) {
  const { game: slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return buildMetadata({ title: "Game Not Found", noIndex: true });
  return buildMetadata({
    title: buildGameOgTitle(game),
    description: buildGameOgDescription(game),
    path: `/games/${game.slug}`,
  });
}

/* ── Performance area icons ────────────────────────────────── */

const areaIcons: Record<PerformanceArea, React.ReactNode> = {
  fps: <Gauge size={14} />,
  "frame-time": <Monitor size={14} />,
  "touch-latency": <Zap size={14} />,
  thermal: <Thermometer size={14} />,
  network: <Wifi size={14} />,
  graphics: <Monitor size={14} />,
  battery: <Battery size={14} />,
  stability: <Cpu size={14} />,
  memory: <HardDrive size={14} />,
};

const areaColors: Record<PerformanceArea, string> = {
  fps: "#00E5A0",
  "frame-time": "#A78BFA",
  "touch-latency": "#60A5FA",
  thermal: "#F97316",
  network: "#38BDF8",
  graphics: "#F59E0B",
  battery: "#34D399",
  stability: "#00E5A0",
  memory: "#E879F9",
};

/* ── Optimization category labels ─────────────────────────── */

const optCategoryLabels: Record<OptimizationCategory, string> = {
  graphics: "Graphics",
  performance: "Performance",
  touch: "Touch",
  network: "Network",
  thermal: "Thermal",
  battery: "Battery",
};

const difficultyVariant = {
  easy: "success",
  moderate: "warning",
  advanced: "error",
} as const;

const riskVariant = {
  low: "success",
  medium: "warning",
  high: "error",
} as const;

const tierVariant = {
  low: "success",
  mid: "warning",
  high: "error",
} as const;

const tierLabel = {
  low: "Low-end (Snapdragon 4xx/6xx)",
  mid: "Mid-range (Snapdragon 7xx/870)",
  high: "High-end (Snapdragon 8 Gen+)",
};

/* ── Component: Section header ─────────────────────────────── */

function SectionHeading({ icon, title, id }: { icon: React.ReactNode; title: string; id: string }) {
  return (
    <h2
      id={id}
      className="flex items-center gap-2 text-lg font-bold text-text-primary"
    >
      <span className="text-accent" aria-hidden="true">{icon}</span>
      {title}
    </h2>
  );
}

/* ── Component: Info row for specs sidebar ─────────────────── */

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border-subtle last:border-0">
      <dt className="text-sm text-text-muted flex-shrink-0">{label}</dt>
      <dd className="text-sm font-mono text-text-primary text-right">{value}</dd>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function GameDetailPage({ params }: Props) {
  const { game: slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  // Resolve related items
  const relatedTools = (
    await Promise.all((game.relatedToolSlugs ?? []).map((s) => getToolBySlug(s)))
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const relatedApps = (
    await Promise.all((game.relatedAppSlugs ?? []).map((s) => getAppBySlug(s)))
  ).filter((a): a is NonNullable<typeof a> => Boolean(a));

  const relatedGuides = (
    await Promise.all((game.relatedGuideSlugs ?? []).map((s) => getGuideBySlug(s)))
  ).filter((g): g is NonNullable<typeof g> => Boolean(g));

  // Group optimization recs by category
  const recsByCategory = game.optimizationRecs.reduce<
    Record<string, typeof game.optimizationRecs>
  >((acc, rec) => {
    const key = rec.category;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(rec);
    return acc;
  }, {});

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      generateGameJsonLd(game),
      generateBreadcrumbsJsonLd([
        { name: "Home", path: "/" },
        { name: "Games", path: "/games" },
        { name: game.name, path: `/games/${game.slug}` },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Breadcrumb bar ── */}
      <div className="border-b border-border-subtle bg-bg-surface">
        <div className="container-content py-3 flex items-center gap-2 text-sm text-text-muted">
          <Link
            href="/games"
            className="hover:text-accent transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Games
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-text-secondary truncate">{game.name}</span>
        </div>
      </div>

      {/* ── Game Hero Header ── */}
      <div className="border-b border-border-subtle bg-bg-surface">
        <div className="container-content py-10">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left: identity */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="label-mono">{CATEGORY_LABELS[game.category]}</span>
                <Badge variant={tierVariant[game.deviceTier]} size="sm">
                  {tierLabel[game.deviceTier]}
                </Badge>
                {game.guideSlug && (
                  <Badge variant="accent" size="sm">Guide Available</Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight leading-tight">
                {game.name}
              </h1>

              {game.altNames && game.altNames.length > 0 && (
                <p className="text-xs font-mono text-text-muted">
                  Also known as: {game.altNames.join(", ")}
                </p>
              )}

              <p className="text-base text-text-secondary leading-relaxed max-w-2xl">
                {game.description}
              </p>

              {/* Performance focus area chips */}
              <div className="flex items-start gap-2 flex-wrap pt-1">
                {game.performanceAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-sm"
                    style={{
                      backgroundColor: `${areaColors[area]}12`,
                      border: `1px solid ${areaColors[area]}30`,
                      color: areaColors[area],
                    }}
                  >
                    {areaIcons[area]}
                    {PERFORMANCE_AREA_LABELS[area]}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-md
                    bg-accent text-bg-base hover:bg-accent-dim transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
                >
                  Diagnostic Tools
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link
                  href="/guides"
                  className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-md
                    bg-bg-elevated border border-border-default text-text-primary
                    hover:border-border-strong hover:bg-bg-overlay transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
                >
                  Browse Guides
                </Link>
              </div>
            </div>

            {/* Right: tech specs card */}
            <aside
              className="border border-border-default bg-bg-elevated rounded-md p-5"
              aria-label="Game specifications"
            >
              <h2 className="label-mono mb-3">Specifications</h2>
              <dl>
                <SpecRow label="Platform" value={game.platform === "android" ? "Android" : game.platform} />
                <SpecRow label="Genre" value={CATEGORY_LABELS[game.category]} />
                {game.minAndroidVersion && (
                  <SpecRow label="Min Android" value={`Android ${game.minAndroidVersion}`} />
                )}
                <SpecRow label="Hardware Profile" value={
                  <span style={{ color: "var(--accent)" }} className="capitalize">{game.deviceTier} Tier</span>
                } />
                <SpecRow label="Performance Focus" value={`${game.performanceAreas.length} areas`} />
                {game.updatedAt && (
                  <SpecRow label="Profile Updated" value={game.updatedAt} />
                )}
              </dl>
            </aside>
          </div>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="container-content section">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* ── Left / Main column ── */}
          <div className="lg:col-span-2 flex flex-col gap-12">

            {/* ════ COMMON PROBLEMS ════ */}
            {game.commonProblems.length > 0 && (
              <section aria-labelledby="problems-heading">
                <div className="flex flex-col gap-6">
                  <SectionHeading
                    id="problems-heading"
                    icon={<TriangleAlert size={18} />}
                    title="Common Performance Problems"
                  />

                  <ol className="flex flex-col gap-4" role="list">
                    {game.commonProblems.map((problem, idx) => (
                      <li
                        key={problem.id}
                        className="border border-border-default bg-bg-surface rounded-md overflow-hidden"
                      >
                        {/* Problem header */}
                        <div className="px-5 py-4 border-b border-border-subtle bg-bg-elevated flex items-start gap-3">
                          <span
                            className="flex-shrink-0 w-5 h-5 rounded-xs flex items-center justify-center font-mono text-[10px] font-bold mt-0.5"
                            style={{
                              backgroundColor: "rgba(0,229,160,0.1)",
                              color: "var(--accent)",
                              border: "1px solid rgba(0,229,160,0.2)",
                            }}
                            aria-hidden="true"
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-text-primary">
                              {problem.title}
                            </h3>
                            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                              {problem.what}
                            </p>
                          </div>
                        </div>

                        {/* Problem detail */}
                        <div className="px-5 py-4 grid sm:grid-cols-2 gap-5">
                          {/* Causes */}
                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono mb-2">
                              Possible Causes
                            </h4>
                            <ul className="flex flex-col gap-1.5" role="list">
                              {problem.causes.map((cause) => (
                                <li key={cause} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                                  <span className="flex-shrink-0 w-1 h-1 rounded-full bg-text-muted mt-2" aria-hidden="true" />
                                  {cause}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Steps */}
                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono mb-2">
                              What to Try
                            </h4>
                            <ol className="flex flex-col gap-1.5" role="list">
                              {problem.steps.map((step, si) => (
                                <li key={si} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                                  <span className="flex-shrink-0 font-mono text-[10px] font-semibold text-text-muted w-4 mt-0.5" aria-hidden="true">
                                    {si + 1}.
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}

            {/* Ad Slot — Between problem analysis and optimization recs (MAX 2 for GAME) */}
            <AdSlot placement="game_after_overview" />

            {/* ════ OPTIMIZATION RECOMMENDATIONS ════ */}
            {game.optimizationRecs.length > 0 && (
              <section aria-labelledby="opt-heading">
                <div className="flex flex-col gap-6">
                  <SectionHeading
                    id="opt-heading"
                    icon={<Cpu size={18} />}
                    title="Optimization Recommendations"
                  />

                  <div className="flex flex-col gap-6">
                    {Object.entries(recsByCategory).map(([category, recs]) => (
                      <div key={category}>
                        <h3 className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span
                            className="w-4 h-px"
                            style={{ backgroundColor: "var(--border-strong)" }}
                            aria-hidden="true"
                          />
                          {optCategoryLabels[category as OptimizationCategory] ?? category}
                        </h3>

                        <ul className="flex flex-col gap-2" role="list">
                          {recs.map((rec) => (
                            <li
                              key={rec.id}
                              className="border border-border-default bg-bg-surface rounded-md p-4 flex flex-col gap-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-sm font-semibold text-text-primary leading-snug">
                                  {rec.title}
                                </h4>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Badge variant={difficultyVariant[rec.difficulty]} size="sm">
                                    {rec.difficulty}
                                  </Badge>
                                  {rec.risk !== "low" && (
                                    <Badge variant={riskVariant[rec.risk]} size="sm">
                                      {rec.risk} risk
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-text-secondary leading-relaxed">
                                {rec.description}
                              </p>
                              {rec.requiresRoot && (
                                <p className="text-[10px] font-mono text-status-warning">
                                  ⚠ Requires root access
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Safety note */}
                  <p className="text-xs text-text-muted leading-relaxed border-l-2 border-border-default pl-3">
                    These recommendations reflect generally safe Android settings adjustments.
                    Results depend on your specific device hardware. Always test after each
                    change rather than applying all at once.
                  </p>
                </div>
              </section>
            )}

            {/* ════ RELATED GUIDES ════ */}
            {relatedGuides.length > 0 && (
              <section aria-labelledby="guides-heading">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <SectionHeading
                      id="guides-heading"
                      icon={<BookOpen size={18} />}
                      title="Related Guides"
                    />
                    <Link
                      href="/guides"
                      className="text-xs font-mono text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                    >
                      All guides <ChevronRight size={12} aria-hidden="true" />
                    </Link>
                  </div>

                  <ul className="flex flex-col gap-2" role="list">
                    {relatedGuides.map((guide) => (
                      <li key={guide.id}>
                        <Link
                          href={`/guides/${guide.slug}`}
                          className="flex items-start justify-between gap-4 p-4 rounded-md
                            border border-border-default bg-bg-surface
                            hover:border-border-strong hover:bg-bg-elevated transition-colors group
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug">
                              {guide.title}
                            </span>
                            <span className="text-xs text-text-secondary line-clamp-1">
                              {guide.excerpt}
                            </span>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-text-muted whitespace-nowrap">
                              {guide.readingTimeMinutes} min
                            </span>
                            <ChevronRight size={14} className="text-text-muted group-hover:text-accent transition-colors" aria-hidden="true" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>

          {/* ── Right / Sidebar ── */}
          <aside className="flex flex-col gap-6">

            {/* ── Related tools ── */}
            {relatedTools.length > 0 && (
              <section
                aria-labelledby="tools-heading"
                className="border border-border-default rounded-md bg-bg-surface"
              >
                <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
                  <Wrench size={14} className="text-accent" aria-hidden="true" />
                  <h2 id="tools-heading" className="label-mono">Relevant Tools</h2>
                </div>
                <ul className="divide-y divide-border-subtle" role="list">
                  {relatedTools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="flex items-center justify-between gap-3 px-5 py-3.5
                          hover:bg-bg-elevated transition-colors group
                          focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-accent/50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug truncate">
                            {tool.name}
                          </p>
                          <p className="text-xs text-text-muted line-clamp-1">{tool.excerpt}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {tool.status !== "available" && (
                            <Badge variant="default" size="sm">{tool.status}</Badge>
                          )}
                          <ChevronRight size={14} className="text-text-muted group-hover:text-accent transition-colors" aria-hidden="true" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-5 py-3 border-t border-border-subtle">
                  <Link
                    href="/tools"
                    className="text-xs font-mono text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                  >
                    All tools <ArrowRight size={11} aria-hidden="true" />
                  </Link>
                </div>
              </section>
            )}

            {/* ── Related apps ── */}
            {relatedApps.length > 0 && (
              <section
                aria-labelledby="apps-heading"
                className="border border-border-default rounded-md bg-bg-surface"
              >
                <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
                  <Smartphone size={14} className="text-accent" aria-hidden="true" />
                  <h2 id="apps-heading" className="label-mono">Android Apps</h2>
                </div>
                <ul className="divide-y divide-border-subtle" role="list">
                  {relatedApps.map((app) => (
                    <li key={app.id}>
                      <Link
                        href={`/apps/${app.slug}`}
                        className="flex items-center justify-between gap-3 px-5 py-3.5
                          hover:bg-bg-elevated transition-colors group
                          focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-accent/50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug truncate">
                            {app.name}
                          </p>
                          <p className="text-xs text-text-muted line-clamp-1">{app.excerpt}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {app.status !== "stable" && (
                            <Badge variant="default" size="sm">{app.status}</Badge>
                          )}
                          <ChevronRight size={14} className="text-text-muted group-hover:text-accent transition-colors" aria-hidden="true" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-5 py-3 border-t border-border-subtle">
                  <Link
                    href="/apps"
                    className="text-xs font-mono text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                  >
                    All apps <ArrowRight size={11} aria-hidden="true" />
                  </Link>
                </div>
              </section>
            )}

            {/* ── Tags ── */}
            {game.tags.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="label-mono">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {game.tags.map((tag) => (
                    <Badge key={tag} variant="default" size="sm">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ad Slot — Sidebar below tags (2nd of 2 allowed on GAME pages) */}
            <AdSlot placement="game_after_overview" format="RECTANGLE_MEDIUM" />

            {/* ── Navigation hint ── */}
            <div className="text-xs text-text-muted leading-relaxed border-t border-border-subtle pt-5">
              <p>
                Performance data on this page reflects common patterns on Android hardware.
                Actual results depend on your device&apos;s SoC, RAM, and software version.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
