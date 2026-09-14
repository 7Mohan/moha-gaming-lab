import { buildMetadata } from "@/lib/metadata";
import { getPublishedGuides } from "@/lib/services/guide-service";
import { GuidesHubClient } from "@/components/guides/GuidesHubClient";
import Link from "next/link";
import { ChevronRight, BookOpen, ShieldCheck } from "lucide-react";

export const metadata = buildMetadata({
  title: "Android Gaming Performance Guides & Technical Knowledge Hub",
  description:
    "Engineering-grounded guides on Android frame pacing, 1% low stutter diagnostics, thermal throttling mitigation, 120Hz display refresh rates, and touch input latency.",
  path: "/guides",
});

export default async function GuidesPage() {
  const { items: guides } = await getPublishedGuides();
  return (
    <div className="container-content section flex flex-col gap-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span className="text-accent" aria-current="page">
          Guides
        </span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-default pb-8">
        <div className="flex flex-col gap-3 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="label-mono">Technical Knowledge Base</span>
            <span className="text-text-muted text-xs font-mono">•</span>
            <span className="text-2xs font-mono text-accent flex items-center gap-1">
              <ShieldCheck size={12} />
              Grounded in Android Architecture
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Gaming Performance Guides & Tutorials
          </h1>

          <p className="text-base text-text-secondary leading-relaxed">
            Practical, technically rigorous manuals for diagnosing and resolving Android gaming bottlenecks. We unpack the math behind frame-time spikes, thermal DVFS clock downclocking, network packet jitter, and display scanout cadences.
          </p>
        </div>

        {/* Quick Hub Navigation */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/tools"
            className="px-4 py-2 rounded bg-bg-elevated hover:bg-bg-overlay border border-border-default text-xs font-mono text-text-primary hover:border-accent/50 transition-colors flex items-center gap-2"
          >
            <span>Live Diagnostic Tools</span>
            <ChevronRight size={13} className="text-accent" />
          </Link>
        </div>
      </div>

      {/* Interactive Search & Filter Catalog */}
      <GuidesHubClient initialGuides={guides} />

      {/* Technical Editorial Philosophy Notice */}
      <div className="p-6 rounded-lg border border-border-subtle bg-bg-elevated/40 flex flex-col gap-2 text-xs text-text-muted">
        <div className="flex items-center gap-2 text-text-primary font-semibold font-mono">
          <BookOpen size={14} className="text-accent" />
          <span>Editorial & Technical Standards</span>
        </div>
        <p className="leading-relaxed">
          Every guide published on Moha Gaming Lab is written with strict technical honesty. We clearly distinguish between directly measured metrics, theoretical limits, and operating system estimates. We never recommend destructive scripts, thermal-daemon bypasses, or fabricated performance tweaks.
        </p>
      </div>
    </div>
  );
}
