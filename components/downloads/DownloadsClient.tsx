"use client";

import * as React from "react";
import type { App, AppRelease } from "@/types/app";
import { formatFileSize, truncateHash, isSafeDownloadUrl } from "@/lib/download-security";
import { Badge } from "@/components/ui/Badge";
import { Search, Download, Copy, Check, ShieldCheck, Terminal, ExternalLink } from "lucide-react";

interface DownloadsClientProps {
  apps: App[];
}

interface FlattenedRelease {
  app: App;
  release: AppRelease;
}

export function DownloadsClient({ apps }: DownloadsClientProps) {
  const [query, setQuery] = React.useState("");
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);

  // Flatten all releases from all apps
  const allReleases: FlattenedRelease[] = React.useMemo(() => {
    const list: FlattenedRelease[] = [];
    apps.forEach((app) => {
      app.releases.forEach((rel) => {
        list.push({ app, release: rel });
      });
    });
    // Sort by release date descending
    return list.sort((a, b) => b.release.releaseDate.localeCompare(a.release.releaseDate));
  }, [apps]);

  const filteredReleases = React.useMemo(() => {
    if (!query.trim()) return allReleases;
    const q = query.toLowerCase().trim();
    return allReleases.filter(
      (item) =>
        item.app.name.toLowerCase().includes(q) ||
        item.release.version.toLowerCase().includes(q) ||
        item.app.category.toLowerCase().includes(q) ||
        item.release.sourceName.toLowerCase().includes(q) ||
        item.release.architectures.some((arch) => arch.toLowerCase().includes(q))
    );
  }, [allReleases, query]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Integrity & Verification Guidance Card */}
      <div className="p-6 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <ShieldCheck size={18} className="text-accent" aria-hidden="true" />
            <span>Cryptographic Integrity & Verification Notice</span>
          </div>
          <span className="text-2xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
            SHA-256 Standard
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Every official APK release distributed by Moha Gaming Lab and our verified partners includes an authoritative cryptographic SHA-256 hash. Always verify that your downloaded file matches the published hash before installing on your Android device to guarantee the file has not been altered or tampered with.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-bg-elevated border border-border-subtle flex flex-col gap-1.5">
            <div className="flex items-center gap-1 text-2xs text-text-muted">
              <Terminal size={12} className="text-accent" />
              <span>Verify on Windows (PowerShell / Command Prompt):</span>
            </div>
            <code className="text-accent overflow-x-auto block">
              certutil -hashfile &lt;filename.apk&gt; SHA256
            </code>
          </div>

          <div className="p-3 rounded bg-bg-elevated border border-border-subtle flex flex-col gap-1.5">
            <div className="flex items-center gap-1 text-2xs text-text-muted">
              <Terminal size={12} className="text-accent" />
              <span>Verify on Linux / macOS / Android Termux:</span>
            </div>
            <code className="text-accent overflow-x-auto block">
              sha256sum &lt;filename.apk&gt;
            </code>
          </div>
        </div>
      </div>

      {/* Releases Filter & Directory */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              All Available Releases ({filteredReleases.length})
            </h2>
            <p className="text-xs text-text-muted font-mono">
              Complete chronological library of verified Android packages
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by app or version..."
              className="w-full pl-9 pr-3 py-1.5 rounded bg-bg-elevated border border-border-default focus:border-accent text-xs text-text-primary placeholder:text-text-muted outline-none font-mono"
            />
          </div>
        </div>

        {/* Releases Table / Cards */}
        <div className="border border-border-default rounded-md overflow-hidden bg-bg-surface divide-y divide-border-subtle">
          {filteredReleases.map(({ app, release }) => {
            const hasUrl = isSafeDownloadUrl(release.downloadUrl);
            const isCopied = copiedHash === release.checksumSha256;

            return (
              <div
                key={`${app.slug}-${release.version}`}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bg-elevated/40 transition-colors"
              >
                {/* Left Column: App & Version Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded bg-bg-elevated border border-border-default flex items-center justify-center flex-shrink-0 text-accent font-mono font-bold text-xs"
                    aria-hidden="true"
                  >
                    {app.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`/apps/${app.slug}`}
                        className="text-sm font-semibold text-text-primary hover:text-accent transition-colors truncate"
                      >
                        {app.name}
                      </a>
                      <span className="text-xs font-mono font-semibold text-accent">
                        v{release.version}
                      </span>
                      <Badge variant="outline" size="sm">
                        Android {release.androidMinVersion}+
                      </Badge>
                      <Badge variant="default" size="sm">
                        {app.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-2xs font-mono text-text-muted flex-wrap">
                      <span>Released: {release.releaseDate}</span>
                      <span>•</span>
                      <span>Size: {formatFileSize(release.fileSize)}</span>
                      <span>•</span>
                      <span>Arch: {release.architectures.join(", ")}</span>
                    </div>

                    {/* SHA-256 Display */}
                    {release.checksumSha256 && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-2xs font-mono text-text-muted">
                          SHA-256:
                        </span>
                        <code
                          className="text-2xs font-mono text-text-secondary bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle truncate max-w-[260px]"
                          title={release.checksumSha256}
                        >
                          {truncateHash(release.checksumSha256, 10)}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(release.checksumSha256!)}
                          className="flex items-center gap-1 text-2xs font-mono text-accent hover:underline"
                          aria-label="Copy SHA-256 hash"
                        >
                          {isCopied ? (
                            <>
                              <Check size={11} />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Source & Download Action */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                  <span className="text-2xs font-mono text-text-muted flex items-center gap-1">
                    <ShieldCheck size={11} className={release.verificationStatus === "verified" ? "text-accent" : "text-text-muted"} />
                    <span>{release.sourceName}</span>
                  </span>

                  {hasUrl ? (
                    <a
                      href={release.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="px-4 py-2 rounded bg-accent hover:bg-accent-dim text-bg-base font-semibold text-xs font-mono flex items-center gap-1.5 transition-colors shadow-sm"
                      aria-label={`Download ${app.name} v${release.version}`}
                    >
                      <Download size={13} aria-hidden="true" />
                      <span>Download APK</span>
                      <ExternalLink size={11} className="opacity-70" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 rounded bg-bg-elevated text-text-muted text-xs font-mono border border-border-subtle">
                      Unavailable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
