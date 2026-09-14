import { buildMetadata } from "@/lib/metadata";
import { getPublishedApps } from "@/lib/services/app-service";
import { DownloadsClient } from "@/components/downloads/DownloadsClient";
import { AdSlot } from "@/components/monetization/AdSlot";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

export const metadata = buildMetadata({
  title: "Download Center & Release Integrity Index — Moha Gaming Lab",
  description:
    "Download verified Android gaming tools, kernel managers, and FPS monitors. Complete chronological archive with SHA-256 checksums, architecture tags, and source verification.",
  path: "/downloads",
});

export default async function DownloadsPage() {
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
          Downloads
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-default pb-8">
        <div className="flex flex-col gap-3 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="label-mono">Release Archive</span>
            <span className="text-text-muted text-xs font-mono">•</span>
            <span className="text-2xs font-mono text-accent flex items-center gap-1">
              <ShieldCheck size={12} />
              Cryptographic Integrity Guaranteed
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Download Center & Verification Library
          </h1>

          <p className="text-base text-text-secondary leading-relaxed">
            Every APK distributed through Moha Gaming Lab is linked directly to official release archives and accompanied by an authoritative SHA-256 checksum. We never repack, modify, inject advertisements into, or alter binary packages.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/apps"
            className="px-4 py-2 rounded bg-bg-elevated hover:bg-bg-overlay border border-border-default text-xs font-mono text-text-primary hover:border-accent/50 transition-colors flex items-center gap-2"
          >
            <span>Browse Apps by Category</span>
            <ChevronRight size={13} className="text-accent" />
          </Link>
        </div>
      </div>

      {/* Main Downloads Client Directory */}
      <DownloadsClient apps={apps} />

      {/* Ad Slot — Clearly separated from download flow (only 1 allowed on DOWNLOAD pages) */}
      <AdSlot placement="download_bottom" />

      {/* Security Statement */}
      <div className="p-6 rounded-lg border border-border-subtle bg-bg-elevated/40 flex flex-col gap-2 text-xs text-text-muted">
        <div className="flex items-center gap-2 text-text-primary font-semibold font-mono">
          <ShieldCheck size={14} className="text-accent" />
          <span>Security & Open Distribution Policy</span>
        </div>
        <p className="leading-relaxed">
          Moha Gaming Lab serves as a verified indexing and discovery layer for Android gaming utilities. If you are an open-source maintainer and wish to update release metadata, provide updated checksum digests, or adjust distribution URLs, please reach out via our contact channels.
        </p>
      </div>
    </div>
  );
}
