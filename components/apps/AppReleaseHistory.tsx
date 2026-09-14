"use client";

import * as React from "react";
import type { App, AppRelease } from "@/types/app";
import { Badge } from "@/components/ui/Badge";
import { formatFileSize, truncateHash } from "@/lib/download-security";
import { DownloadButton } from "@/features/download/DownloadButton";
import { compareReleasesDesc } from "@/lib/download/versions";
import { Calendar, Layers, ShieldCheck, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface AppReleaseHistoryProps {
  app: App;
}

export function AppReleaseHistory({ app }: AppReleaseHistoryProps) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);

  // Filter only published releases and sort using semantic/numerical version code
  const publishedReleases = React.useMemo(() => {
    const list = (app.releases || []).filter(
      (rel) => !rel.status || rel.status.toLowerCase() === "published"
    );
    return [...list].sort(compareReleasesDesc);
  }, [app.releases]);

  if (publishedReleases.length === 0) {
    return (
      <div className="p-4 rounded border border-border-default bg-bg-surface text-sm text-text-muted">
        No public release archives published yet.
      </div>
    );
  }

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono text-text-muted">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-accent" aria-hidden="true" />
          <span>Release Archives ({publishedReleases.length} published {publishedReleases.length === 1 ? "version" : "versions"})</span>
        </div>
        <span>Ordered by version & release code</span>
      </div>

      <div className="border border-border-default rounded-md overflow-hidden bg-bg-surface divide-y divide-border-subtle">
        {publishedReleases.map((rel: AppRelease, idx: number) => {
          const isLatest = idx === 0;
          const isExpanded = expandedIndex === idx;
          const isHosted = rel.sourceType === "hosted" || Boolean(rel.storagePath);

          return (
            <div key={rel.id || rel.version} className="p-4 flex flex-col gap-3">
              {/* Summary Row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-base font-bold font-mono text-text-primary">
                    v{rel.version}
                  </span>
                  {rel.versionCode && (
                    <span className="text-2xs font-mono text-text-muted">
                      (build {rel.versionCode})
                    </span>
                  )}
                  {isLatest && (
                    <Badge variant="success" size="sm">LATEST</Badge>
                  )}
                  {isHosted ? (
                    <Badge variant="outline" size="sm" className="border-accent/40 text-accent">
                      Hosted Artifact
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">
                      Mirror
                    </Badge>
                  )}
                  <Badge variant="outline" size="sm">
                    Android {rel.androidMinVersion}+
                  </Badge>
                  {rel.architectures.map((arch) => (
                    <Badge key={arch} variant="default" size="sm">
                      {arch}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} aria-hidden="true" />
                    {rel.releaseDate}
                  </span>
                  <span>{formatFileSize(rel.fileSizeBytes ?? rel.fileSize)}</span>
                </div>
              </div>

              {/* Source & Verification Status */}
              <div className="flex items-center justify-between gap-2 text-2xs font-mono text-text-muted flex-wrap">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck
                    size={12}
                    className={
                      rel.verificationStatus === "verified"
                        ? "text-accent"
                        : rel.verificationStatus === "pending"
                        ? "text-amber-400"
                        : "text-text-muted"
                    }
                    aria-hidden="true"
                  />
                  <span>Source:</span>
                  <span className="text-text-secondary">{rel.sourceName || (isHosted ? "Hosted Storage" : "External")}</span>
                </div>

                {rel.checksumSha256 && (
                  <div className="flex items-center gap-2 truncate max-w-sm">
                    <span>SHA-256:</span>
                    <code className="text-text-muted font-mono" title={rel.checksumSha256}>
                      {truncateHash(rel.checksumSha256, 6)}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(rel.checksumSha256!)}
                      className="p-1 text-text-muted hover:text-white transition-colors cursor-pointer"
                      title="Copy SHA-256 checksum"
                      aria-label="Copy SHA-256 checksum"
                    >
                      {copiedHash === rel.checksumSha256 ? (
                        <Check size={11} className="text-accent" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Changelog Accordion Toggle */}
              {rel.changelog && rel.changelog.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    className="flex items-center gap-1 text-2xs font-mono text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent cursor-pointer"
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? "Hide Changelog" : `View Changelog (${rel.changelog.length} changes)`}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {isExpanded && (
                    <ul className="mt-2 pl-4 list-disc text-xs text-text-secondary flex flex-col gap-1">
                      {rel.changelog.map((entry, cIdx) => (
                        <li key={cIdx} className="leading-relaxed">
                          {entry}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Download Action */}
              <div className="pt-2 border-t border-border-subtle">
                <DownloadButton app={app} release={rel} showDetails={false} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
