import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getToolBySlug, getAllToolSlugs } from "@/lib/services/tool-service";
import { getGuideBySlug } from "@/lib/services/guide-service";
import { getGameBySlug } from "@/lib/services/game-service";
import { buildMetadata } from "@/lib/metadata";
import { buildToolOgTitle, buildToolOgDescription } from "@/types/tool";
import { CATEGORY_LABELS } from "@/lib/tools";
import { ToolDispatcher } from "@/components/tools/ToolDispatcher";
import { ToolCard } from "@/components/cards/ToolCard";
import { Badge } from "@/components/ui/Badge";
import { AdSlot } from "@/components/monetization/AdSlot";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Gamepad2,
  Wrench,
} from "lucide-react";

import { generateToolJsonLd, generateBreadcrumbsJsonLd } from "@/lib/seo/structured-data";

interface Props {
  params: Promise<{ tool: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllToolSlugs();
  return slugs.map((slug) => ({ tool: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return buildMetadata({ title: "Tool Not Found", noIndex: true });

  return buildMetadata({
    title: buildToolOgTitle(tool),
    description: buildToolOgDescription(tool),
    path: `/tools/${tool.slug}`,
  });
}

export default async function ToolDetailPage({ params }: Props) {
  const { tool: slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  // Resolve related entities
  const relatedTools = (
    await Promise.all((tool.relatedToolSlugs || []).map((s) => getToolBySlug(s)))
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const relatedGuides = (
    await Promise.all((tool.relatedGuideSlugs || []).map((s) => getGuideBySlug(s)))
  ).filter((g): g is NonNullable<typeof g> => Boolean(g));

  const relatedGames = (
    await Promise.all((tool.relatedGameSlugs || []).map((s) => getGameBySlug(s)))
  ).filter((gm): gm is NonNullable<typeof gm> => Boolean(gm));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      generateToolJsonLd(tool),
      generateBreadcrumbsJsonLd([
        { name: "Home", path: "/" },
        { name: "Tools", path: "/tools" },
        { name: tool.name, path: `/tools/${tool.slug}` },
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
            href="/tools"
            className="hover:text-accent transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Tools</span>
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-text-primary font-medium truncate">
            {tool.name}
          </span>
        </div>
      </div>

      <div className="container-content section">
        <div className="flex flex-col gap-10">
          {/* ════ TOOL HEADER ════ */}
          <header className="flex flex-col gap-4 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="accent">
                {CATEGORY_LABELS[tool.category] || tool.category}
              </Badge>
              <Badge variant="default" className="capitalize">
                {tool.difficulty}
              </Badge>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono text-accent bg-accent/10 border border-accent/20">
                <ShieldCheck size={11} />
                <span>100% Client-Side Engine</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              {tool.name}
            </h1>

            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
              {tool.description}
            </p>
          </header>

          {/* ════ LIVE TOOL INTERFACE (Primary Focus) ════ */}
          <section
            aria-labelledby="tool-engine-heading"
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-3">
              <h2
                id="tool-engine-heading"
                className="text-sm font-mono font-bold uppercase tracking-wider text-text-primary flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Live Diagnostic Utility
              </h2>
              <span className="text-2xs font-mono text-text-muted">
                Zero data uploaded • Local execution
              </span>
            </div>

            {/* Dynamic Interactive Engine Island */}
            <div className="border border-border-default bg-bg-surface/50 rounded-lg p-5 sm:p-6 shadow-sm">
              <ToolDispatcher tool={tool} />
            </div>
          </section>

          {/* ════ WHAT THIS TOOL DOES & MEASURES ════ */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border-default bg-bg-surface rounded-md p-5 flex flex-col gap-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                What This Tool Does
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {tool.whatItDoes}
              </p>
            </div>

            <div className="border border-border-default bg-bg-surface rounded-md p-5 flex flex-col gap-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                What It Measures
              </h3>
              <ul className="flex flex-col gap-1.5" role="list">
                {tool.whatItMeasures.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed"
                  >
                    <CheckCircle2
                      size={13}
                      className="text-accent flex-shrink-0 mt-0.5"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ════ TECHNICAL EXPLANATION & INTERPRETATION ════ */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border-default bg-bg-surface rounded-md p-5 flex flex-col gap-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                Technical Explanation
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {tool.technicalExplanation}
              </p>
            </div>

            <div className="border border-border-default bg-bg-surface rounded-md p-5 flex flex-col gap-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                How To Interpret Results
              </h3>
              <ul className="flex flex-col gap-2" role="list">
                {tool.howToInterpret.map((guide, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ad Slot — Below diagnostic results (tool_after_result, only 1 allowed on TOOL pages) */}
          <AdSlot placement="tool_after_result" />

          {/* ════ RELATED GUIDES & GAMES ════ */}
          {(relatedGuides.length > 0 || relatedGames.length > 0) && (
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border-subtle">
              {/* Related Technical Guides */}
              {relatedGuides.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <BookOpen size={14} className="text-accent" />
                    Related Optimization Guides
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {relatedGuides.map((guide) => (
                      <li key={guide.id}>
                        <Link
                          href={`/guides/${guide.slug}`}
                          className="p-3.5 rounded-md border border-border-subtle bg-bg-surface hover:bg-bg-elevated hover:border-border-default transition-all flex items-center justify-between group"
                        >
                          <div>
                            <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors block">
                              {guide.title}
                            </span>
                            <span className="text-2xs text-text-muted">
                              {guide.readingTimeMinutes} min read • {guide.category}
                            </span>
                          </div>
                          <ArrowRight size={13} className="text-text-muted group-hover:text-accent transition-colors" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Game Profiles */}
              {relatedGames.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <Gamepad2 size={14} className="text-accent" />
                    Relevant Game Performance Profiles
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {relatedGames.map((game) => (
                      <li key={game.id}>
                        <Link
                          href={`/games/${game.slug}`}
                          className="p-3.5 rounded-md border border-border-subtle bg-bg-surface hover:bg-bg-elevated hover:border-border-default transition-all flex items-center justify-between group"
                        >
                          <div>
                            <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors block">
                              {game.name}
                            </span>
                            <span className="text-2xs text-text-muted">
                              {game.excerpt}
                            </span>
                          </div>
                          <ArrowRight size={13} className="text-text-muted group-hover:text-accent transition-colors" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ════ RELATED TOOLS ════ */}
          {relatedTools.length > 0 && (
            <div className="flex flex-col gap-4 pt-6 border-t border-border-subtle">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <Wrench size={14} className="text-accent" />
                Other Diagnostic Utilities
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedTools.slice(0, 3).map((relTool) => (
                  <ToolCard key={relTool.id} tool={relTool} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
