import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";
import { AnimatedHero } from "@/components/hero/AnimatedHero";
import { HeroGameSlider } from "@/components/hero/HeroGameSlider";
import { AnimatedArticles } from "@/components/sections/AnimatedArticles";
import { AppCard } from "@/components/cards/AppCard";
import { GameCard } from "@/components/cards/GameCard";
import { ToolCard } from "@/components/cards/ToolCard";
import { GuideCard } from "@/components/cards/GuideCard";
import { getFeaturedApps } from "@/data/apps";
import { getFeaturedGames } from "@/data/games";
import { getFeaturedTools } from "@/data/tools";
import { getFeaturedGuides } from "@/data/guides";
import { ArrowRight, Cpu, Wifi, Zap, BookOpen } from "lucide-react";
import { AdSlot } from "@/components/monetization/AdSlot";

export const metadata: Metadata = buildMetadata();

/* ── Platform capability strip items ─────────────────────── */
const CAPABILITIES = [
  {
    icon: <Cpu size={16} />,
    term: "FPS Analysis",
    detail: "Frame rate & stability",
  },
  {
    icon: <Wifi size={16} />,
    term: "Network Diagnostics",
    detail: "Ping, jitter, packet loss",
  },
  {
    icon: <Zap size={16} />,
    term: "Device Optimization",
    detail: "SoC & memory tuning",
  },
  {
    icon: <BookOpen size={16} />,
    term: "Game Guides",
    detail: "Technical & practical",
  },
] as const;

/* ── How it works steps ───────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Understand Your Device",
    body: "Use our tools to identify your Android device's performance tier, chipset generation, and thermal constraints before tuning.",
  },
  {
    step: "02",
    title: "Diagnose the Problem",
    body: "Network latency, frame drops, thermal throttling — each issue has a distinct pattern. Our guides help you pinpoint which one is hurting your game.",
  },
  {
    step: "03",
    title: "Apply the Right Fix",
    body: "Not every tweak works on every phone. We explain what each optimization does and which devices it genuinely helps.",
  },
] as const;

export default function HomePage() {
  const featuredGames  = getFeaturedGames();
  const featuredApps   = getFeaturedApps();
  const featuredTools  = getFeaturedTools();
  const featuredGuides = getFeaturedGuides();

  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section
        className="relative min-h-[calc(100dvh-3.75rem)] flex items-center overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.028]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />

        {/* Accent radial bloom — top left */}
        <div
          className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,229,160,0.04) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
          aria-hidden="true"
        />

        <div className="container-content relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* ── Left: Copy ── */}
            <div className="flex flex-col gap-7">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5">
                <span className="accent-line" aria-hidden="true" />
                <span className="label-mono">Android Gaming Platform</span>
              </div>

              {/* Headline with game background slider */}
              <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl min-h-[260px] sm:min-h-[290px] bg-bg-surface"
                   style={{ isolation: "isolate" }}>
                {/* Game slider lives behind the headline text */}
                <HeroGameSlider />

                {/* Headline text on top */}
                <div className="relative z-10 px-6 sm:px-8 pt-7 pb-16">
                  <h1
                    id="hero-heading"
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.06] tracking-tight"
                    style={{ textShadow: "0 3px 28px rgba(0,0,0,0.9)" }}
                  >
                    Gaming Performance.
                    <br />
                    <span style={{ color: "#00E5A0", textShadow: "0 0 32px rgba(0,229,160,0.6)" }}>Engineering.</span>
                  </h1>
                  <p className="mt-3 text-xs font-mono text-white/80 uppercase tracking-widest" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
                    PUBG · eFootball · COD · Free Fire · Mobile Legends · Genshin
                  </p>
                </div>
              </div>

              {/* Sub-copy */}
              <p className="text-lg text-text-secondary leading-relaxed max-w-[44ch]">
                Diagnostics, optimization tools, and technical guides for
                Android gaming — built to improve real gameplay, not just look impressive.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  id="hero-cta-tools"
                  href="/tools"
                  className="inline-flex items-center gap-2 h-12 px-6 text-base font-semibold rounded-md
                    bg-accent text-bg-base hover:bg-accent-dim transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
                >
                  Explore Tools
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  id="hero-cta-guides"
                  href="/guides"
                  className="inline-flex items-center gap-2 h-12 px-6 text-base font-semibold rounded-md
                    bg-bg-elevated border border-border-default text-text-primary
                    hover:border-border-strong hover:bg-bg-overlay transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
                >
                  Read Guides
                </Link>
              </div>

              {/* Small trust line */}
              <p
                className="text-xs font-mono text-text-muted"
                style={{ letterSpacing: "0.06em" }}
              >
                PUBG Mobile &middot; Call of Duty &middot; eFootball &middot; Mobile Legends &middot; Free Fire
              </p>
            </div>

            {/* ── Right: Diagnostic Panel ── */}
            <div className="flex items-center justify-center py-10 lg:py-0">
              <AnimatedHero />
            </div>
          </div>
        </div>

        {/* Bottom separator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-border-subtle"
          aria-hidden="true"
        />
      </section>


      {/* ══════════════════════════════════════════════
          PLATFORM CAPABILITIES STRIP
      ══════════════════════════════════════════════ */}
      <section
        className="border-b border-border-subtle bg-bg-surface"
        aria-label="Platform focus areas"
      >
        <div className="container-content py-8">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {CAPABILITIES.map(({ icon, term, detail }) => (
              <div key={term} className="flex flex-col gap-1.5">
                <dt className="flex items-center gap-2">
                  <span className="text-accent" aria-hidden="true">{icon}</span>
                  <span className="label-mono">{term}</span>
                </dt>
                <dd className="text-sm text-text-secondary pl-6">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Monetization Slot 1: Post-Hero Banner */}
      <div className="container-content py-2">
        <AdSlot placement="homepage_after_hero" format="BANNER_HORIZONTAL" />
      </div>


      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="section border-b border-border-subtle" aria-labelledby="how-heading">
        <div className="container-content">
          <div className="flex flex-col gap-3 mb-12 max-w-xl">
            <span className="label-mono">The Process</span>
            <h2 id="how-heading" className="text-2xl font-bold text-text-primary">
              How Moha Gaming Lab Works
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Gaming performance problems have real technical causes. We help you trace
              them, understand them, and fix them — in that order.
            </p>
          </div>

          <ol className="grid sm:grid-cols-3 gap-6" role="list">
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <li
                key={step}
                className="relative flex flex-col gap-3 p-6 rounded-md bg-bg-surface border border-border-default"
              >
                {/* Step number */}
                <span
                  className="font-mono text-[11px] font-semibold tracking-widest"
                  style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
                  aria-hidden="true"
                >
                  {step}
                </span>

                <h3 className="text-base font-semibold text-text-primary">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{body}</p>

                {/* Connector line (not on last item) */}
                <div
                  className="absolute top-9 right-0 w-6 hidden sm:[&:not(:last-child)]:block"
                  aria-hidden="true"
                  style={{
                    height: "1px",
                    background: "var(--border-default)",
                    transform: "translateX(100%)",
                  }}
                />
              </li>
            ))}
          </ol>
        </div>
      </section>


      {/* ══════════════════════════════════════════════
          SUPPORTED GAMES
      ══════════════════════════════════════════════ */}
      <section
        className="section border-b border-border-subtle bg-bg-surface"
        aria-labelledby="games-heading"
      >
        <div className="container-content">
          <div className="flex items-end justify-between mb-8">
            <div className="flex flex-col gap-2">
              <span className="label-mono">Optimized Games</span>
              <h2 id="games-heading" className="text-2xl font-bold text-text-primary">
                Supported Mobile Titles
              </h2>
            </div>
            <Link
              href="/games"
              className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
            >
              All games <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <ul className="grid-cards-3" role="list">
            {featuredGames.map((game) => (
              <li key={game.id}>
                <GameCard game={game} />
              </li>
            ))}
          </ul>

          <div className="mt-6 flex sm:hidden">
            <Link
              href="/games"
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors"
            >
              View all games <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════
          OUR APPS
      ══════════════════════════════════════════════ */}
      <section
        className="section border-b border-border-subtle"
        aria-labelledby="apps-heading"
      >
        <div className="container-content">
          <div className="flex items-end justify-between mb-8">
            <div className="flex flex-col gap-2">
              <span className="label-mono">Our Apps</span>
              <h2 id="apps-heading" className="text-2xl font-bold text-text-primary">
                Android Tools We&apos;re Building
              </h2>
            </div>
            <Link
              href="/apps"
              className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
            >
              All apps <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <ul className="grid-cards-2" role="list">
            {featuredApps.map((app) => (
              <li key={app.id}>
                <AppCard app={app} />
              </li>
            ))}
          </ul>
        </div>
      </section>


      {/* ══════════════════════════════════════════════
          WEB TOOLS
      ══════════════════════════════════════════════ */}
      <section
        className="section border-b border-border-subtle bg-bg-surface"
        aria-labelledby="tools-heading"
      >
        <div className="container-content">
          <div className="flex items-end justify-between mb-8">
            <div className="flex flex-col gap-2">
              <span className="label-mono">Web Tools</span>
              <h2 id="tools-heading" className="text-2xl font-bold text-text-primary">
                Diagnostics &amp; Calculators
              </h2>
            </div>
            <Link
              href="/tools"
              className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
            >
              All tools <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <ul className="grid-cards-3" role="list">
            {featuredTools.map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} />
              </li>
            ))}
          </ul>
        </div>
      </section>


      {/* ══════════════════════════════════════════════
          GUIDES
      ══════════════════════════════════════════════ */}
      <section
        className="section border-b border-border-subtle"
        aria-labelledby="guides-heading"
      >
        <div className="container-content">
          <div className="flex items-end justify-between mb-8">
            <div className="flex flex-col gap-2">
              <span className="label-mono">Guides</span>
              <h2 id="guides-heading" className="text-2xl font-bold text-text-primary">
                Technical Gaming Guides
              </h2>
            </div>
            <Link
              href="/guides"
              className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
            >
              All guides <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <ul className="grid-cards-3" role="list">
            {featuredGuides.map((guide) => (
              <li key={guide.id}>
                <GuideCard guide={guide} />
              </li>
            ))}
          </ul>
        </div>
      </section>


      {/* ══════════════════════════════════════════════
          ARTICLES — animated scroll-in cards
      ══════════════════════════════════════════════ */}
      <AnimatedArticles />


      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="section" aria-labelledby="cta-heading">
        <div className="container-content">
          <div
            className="relative overflow-hidden rounded-md border border-border-default bg-bg-surface px-8 py-14 text-center flex flex-col items-center gap-6"
          >
            {/* Reticle corners (HUD style) */}
            <span className="hud-reticle-tl" aria-hidden="true" />
            <span className="hud-reticle-tr" aria-hidden="true" />
            <span className="hud-reticle-bl" aria-hidden="true" />
            <span className="hud-reticle-br" aria-hidden="true" />

            {/* Subtle bloom */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,229,160,0.04) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            <div className="flex flex-col gap-3 relative z-10 max-w-lg">
              <span className="label-mono">Start Here</span>
              <h2
                id="cta-heading"
                className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight"
              >
                Know your device.
                <br />
                Fix the right problem.
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Start with our device tier checker or go straight to a game-specific
                guide. No account needed.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
              <Link
                id="cta-explore-tools"
                href="/tools"
                className="inline-flex items-center gap-2 h-12 px-6 text-base font-semibold rounded-md
                  bg-accent text-bg-base hover:bg-accent-dim transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
              >
                Explore Tools
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                id="cta-view-games"
                href="/games"
                className="inline-flex items-center gap-2 h-12 px-6 text-base font-semibold rounded-md
                  bg-bg-elevated border border-border-default text-text-primary
                  hover:border-border-strong hover:bg-bg-overlay transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
              >
                View Games
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Monetization Slot 2: Pre-Footer Banner */}
      <div className="container-content py-6">
        <AdSlot placement="homepage_before_footer" format="RESPONSIVE" />
      </div>
    </>
  );
}
