import { buildMetadata } from "@/lib/metadata";
import { getPublishedApps } from "@/lib/services/app-service";
import { AppsHubClient } from "@/components/apps/AppsHubClient";
import Link from "next/link";
import { ChevronRight, Smartphone, ShieldCheck } from "lucide-react";

export const metadata = buildMetadata({
  title: "Android Apps Hub — Gaming Performance Tools & Utilities",
  description:
    "Discover verified Android gaming utilities, kernel managers, FPS telemetry daemons, and system optimizers. Complete with architecture info, SHA-256 checksums, and permission audits.",
  path: "/apps",
});

export default async function AppsPage() {
  const { items: apps } = await getPublishedApps();
  return (
    <div className="container-content section flex flex-col gap-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span className="text-accent" aria-current="page">
          Apps
        </span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-default pb-8">
        <div className="flex flex-col gap-3 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="label-mono">Android Ecosystem</span>
            <span className="text-text-muted text-xs font-mono">•</span>
            <span className="text-2xs font-mono text-accent flex items-center gap-1">
              <ShieldCheck size={12} />
              Verified Distribution
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Android Gaming Apps & Utilities
          </h1>

          <p className="text-base text-text-secondary leading-relaxed">
            Practical Android applications and system utilities engineered for mobile gamers, performance troubleshooters, and power users. Every release includes transparent architecture metadata, permission audits, and cryptographic SHA-256 verification.
          </p>
        </div>

        {/* Quick Hub Navigation */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/downloads"
            className="px-4 py-2 rounded bg-bg-elevated hover:bg-bg-overlay border border-border-default text-xs font-mono text-text-primary hover:border-accent/50 transition-colors flex items-center gap-2"
          >
            <span>Download Center & Hashes</span>
            <ChevronRight size={13} className="text-accent" />
          </Link>
        </div>
      </div>

      {/* Interactive Search & Filter Catalog */}
      <AppsHubClient initialApps={apps} />

      {/* Safety & Integrity Philosophy Notice */}
      <div className="p-6 rounded-lg border border-border-subtle bg-bg-elevated/40 flex flex-col gap-2 text-xs text-text-muted">
        <div className="flex items-center gap-2 text-text-primary font-semibold font-mono">
          <Smartphone size={14} className="text-accent" />
          <span>Moha Gaming Lab App Verification Policy</span>
        </div>
        <p className="leading-relaxed">
          We reject predatory APK marketplace practices. We do not bundle adware, inject analytics, fabricate download counters, or distribute unverified binary repacks. Downloads link directly to official developer releases or verified repository mirrors with matching SHA-256 checksums.
        </p>
      </div>
    </div>
  );
}
