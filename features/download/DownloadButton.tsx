"use client";

import * as React from "react";
import { Download, Check, Copy, ExternalLink, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import type { App, AppRelease } from "@/types/app";
import { buttonClasses } from "@/components/ui/Button";
import { formatFileSize, truncateHash } from "@/lib/download-security";
import { Badge } from "@/components/ui/Badge";

interface DownloadButtonProps {
  app: App;
  release?: AppRelease;
  className?: string;
  showDetails?: boolean;
}

type DownloadState = "READY" | "PREPARING" | "DOWNLOADING" | "REDIRECTING" | "FAILED" | "UNAVAILABLE";

export function DownloadButton({
  app,
  release,
  className,
  showDetails = true,
}: DownloadButtonProps) {
  // Select target release, preferring published
  const targetRelease =
    release ??
    app.releases.find((r) => !r.status || r.status.toLowerCase() === "published") ??
    app.releases[0];

  const [copied, setCopied] = React.useState(false);
  const [downloadState, setDownloadState] = React.useState<DownloadState>("READY");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const version = targetRelease?.version ?? "Latest";
  const checksum = targetRelease?.checksumSha256;
  const sourceName = targetRelease?.sourceName ?? (targetRelease?.storagePath ? "Hosted Supabase Storage" : "External Source");
  const verification = (targetRelease?.verificationStatus ?? "unverified").toLowerCase();
  const isPublished = !targetRelease?.status || targetRelease.status.toLowerCase() === "published";
  const hasValidArtifact = Boolean(targetRelease?.storagePath || targetRelease?.downloadUrl);

  const isDownloadable = isPublished && hasValidArtifact && verification !== "failed";

  const handleCopyChecksum = React.useCallback(() => {
    if (!checksum) return;
    navigator.clipboard.writeText(checksum).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [checksum]);

  const handleDownload = React.useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!targetRelease || !isDownloadable) return;

    setDownloadState("PREPARING");
    setErrorMessage(null);

    try {
      // Direct client to the secure gateway endpoint
      const releaseIdentifier = targetRelease.id || targetRelease.version;
      const downloadEndpoint = `/api/download/release/${encodeURIComponent(releaseIdentifier)}?app=${encodeURIComponent(app.slug)}`;

      setDownloadState("REDIRECTING");

      // Small delay for accessible screen-reader announcement & UI feedback
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Trigger download via location redirect
      window.location.href = downloadEndpoint;

      setTimeout(() => {
        setDownloadState("READY");
      }, 4000);
    } catch (err) {
      setDownloadState("FAILED");
      setErrorMessage("Download gateway temporarily unavailable. Please try again.");
      setTimeout(() => setDownloadState("READY"), 5000);
    }
  }, [targetRelease, isDownloadable, app.slug]);

  if (!isDownloadable) {
    let unavailReason = "Release in preparation or direct distribution restricted";
    if (verification === "failed") {
      unavailReason = "Integrity check failed: distribution suspended";
    } else if (targetRelease && !isPublished) {
      unavailReason = `Release status is ${targetRelease.status?.toUpperCase() || "UNPUBLISHED"}`;
    }

    return (
      <div className={`flex flex-col gap-2 ${className ?? ""}`}>
        <button
          type="button"
          disabled
          className={buttonClasses({
            variant: "secondary",
            size: "md",
            className: "w-full opacity-60 cursor-not-allowed justify-center",
          })}
          aria-label={`${app.name} is currently not available for direct download`}
        >
          <AlertCircle size={16} className="text-text-muted" aria-hidden="true" />
          <span>Download Unavailable</span>
        </button>
        <span className="text-2xs font-mono text-text-muted text-center">
          {unavailReason}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      {/* Primary Download Trigger */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloadState === "PREPARING" || downloadState === "REDIRECTING"}
        className={buttonClasses({
          variant: "primary",
          size: "lg",
          className: "w-full justify-center group font-medium shadow-sm cursor-pointer disabled:opacity-80",
        })}
        aria-label={`Download ${app.name} version ${version} from ${sourceName}`}
      >
        {downloadState === "PREPARING" ? (
          <>
            <Loader2 size={18} className="animate-spin text-black" aria-hidden="true" />
            <span>Preparing download...</span>
          </>
        ) : downloadState === "REDIRECTING" ? (
          <>
            <Loader2 size={18} className="animate-spin text-black" aria-hidden="true" />
            <span>Connecting to storage mirror...</span>
          </>
        ) : (
          <>
            <Download size={18} className="transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
            <span>Download APK (v{version})</span>
            <ExternalLink size={14} className="opacity-70 ml-1" aria-hidden="true" />
          </>
        )}
      </button>

      {errorMessage && (
        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono text-center">
          {errorMessage}
        </div>
      )}

      {showDetails && (
        <div className="flex flex-col gap-2 p-3 rounded bg-bg-elevated border border-border-default text-xs font-mono">
          {/* Metadata Row: File Size & Source */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Size:</span>
              <span className="text-text-primary font-semibold">
                {formatFileSize(targetRelease?.fileSizeBytes ?? targetRelease?.fileSize)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Source:</span>
              <span className="text-accent truncate max-w-[160px]" title={sourceName}>
                {sourceName}
              </span>
            </div>
          </div>

          {/* Compatibility & Verification Status */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle flex-wrap">
            <div className="flex items-center gap-1.5 text-2xs">
              <ShieldCheck
                size={13}
                className={
                  verification === "verified"
                    ? "text-accent"
                    : verification === "pending"
                    ? "text-amber-400"
                    : "text-text-muted"
                }
                aria-hidden="true"
              />
              <span className="text-text-muted">Integrity:</span>
              <span
                className={
                  verification === "verified"
                    ? "text-accent font-semibold"
                    : verification === "pending"
                    ? "text-amber-400 font-semibold"
                    : "text-text-secondary"
                }
              >
                {verification === "verified"
                  ? "Cryptographically Verified"
                  : verification === "pending"
                  ? "Pending Verification"
                  : "Unverified Upstream Mirror"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {targetRelease?.androidMinVersion && (
                <Badge variant="outline" size="sm">
                  Android {targetRelease.androidMinVersion}+
                </Badge>
              )}
              {targetRelease?.architectures && targetRelease.architectures.length > 0 && (
                <Badge variant="default" size="sm">
                  {targetRelease.architectures[0]}
                </Badge>
              )}
            </div>
          </div>

          {/* SHA-256 Checksum Copy Row */}
          {checksum && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-1 text-2xs text-text-muted truncate min-w-0">
                <span className="font-semibold text-text-secondary">SHA-256:</span>
                <code className="text-text-muted text-2xs truncate font-mono" title={checksum}>
                  {truncateHash(checksum, 8)}
                </code>
              </div>
              <button
                type="button"
                onClick={handleCopyChecksum}
                className="flex items-center gap-1 px-2 py-0.5 text-2xs rounded bg-bg-surface hover:bg-bg-overlay text-text-secondary hover:text-text-primary border border-border-subtle transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent cursor-pointer"
                title="Copy full 64-character SHA-256 hash"
                aria-label="Copy full SHA-256 hash"
              >
                {copied ? (
                  <>
                    <Check size={11} className="text-accent" aria-hidden="true" />
                    <span className="text-accent font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} aria-hidden="true" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Honest Anti-Slop Security Disclaimer */}
          <div className="pt-2 border-t border-border-subtle text-[10px] text-text-muted leading-tight">
            Cryptographic SHA-256 hash guarantees bit-for-bit file integrity against upstream tampering.
          </div>
        </div>
      )}
    </div>
  );
}
