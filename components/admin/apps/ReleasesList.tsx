"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { VerifyReleaseDialog, RevokeReleaseDialog } from "./VerifyReleaseDialog";
import {
  deleteReleaseAction,
  verifyReleaseIntegrityAction,
  publishReleaseAction,
  archiveReleaseAction,
} from "@/app/admin/(dashboard)/apps/actions";
import { formatFileSize, truncateHash } from "@/lib/download-security";
import type { App, AppRelease } from "@/types/app";

interface ReleasesListProps {
  app: App;
}

export function ReleasesList({ app }: ReleasesListProps) {
  const router = useRouter();
  const [selectedVerify, setSelectedVerify] = React.useState<AppRelease | null>(null);
  const [selectedRevoke, setSelectedRevoke] = React.useState<AppRelease | null>(null);
  const [busyVersion, setBusyVersion] = React.useState<string | null>(null);
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  function copyChecksum(hash: string) {
    navigator.clipboard.writeText(hash).then(() => {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    });
  }

  async function handleVerifyIntegrity(version: string) {
    setBusyVersion(version);
    setActionError(null);
    try {
      const res = await verifyReleaseIntegrityAction(app.slug, version);
      if (!res.success) {
        setActionError(res.error || "Integrity verification failed.");
      }
      router.refresh();
    } catch (err) {
      setActionError(String(err instanceof Error ? err.message : err));
    } finally {
      setBusyVersion(null);
    }
  }

  async function handlePublish(version: string) {
    setBusyVersion(version);
    setActionError(null);
    try {
      const res = await publishReleaseAction(app.slug, version);
      if (!res.success) {
        setActionError(res.error || "Failed to publish release.");
      }
      router.refresh();
    } catch (err) {
      setActionError(String(err instanceof Error ? err.message : err));
    } finally {
      setBusyVersion(null);
    }
  }

  async function handleArchive(version: string) {
    if (
      !confirm(
        `Are you sure you want to archive release v${version}? This will remove it from public downloads.`
      )
    ) {
      return;
    }
    setBusyVersion(version);
    setActionError(null);
    try {
      const res = await archiveReleaseAction(app.slug, version, "Archived by administrator");
      if (!res.success) {
        setActionError(res.error || "Failed to archive release.");
      }
      router.refresh();
    } catch (err) {
      setActionError(String(err instanceof Error ? err.message : err));
    } finally {
      setBusyVersion(null);
    }
  }

  async function handleDelete(release: AppRelease) {
    const isPublished = (release.status || "published").toLowerCase() === "published";
    if (isPublished) {
      alert(
        "Delete Safety: Published releases cannot be directly deleted because users may be actively downloading them. Please archive this release first before permanently deleting it."
      );
      return;
    }

    if (
      !confirm(
        `PERMANENT DESTRUCTION: Delete release v${release.version} permanently? Any hosted APK in storage will also be deleted. This cannot be undone.`
      )
    ) {
      return;
    }

    setBusyVersion(release.version);
    setActionError(null);
    try {
      const res = await deleteReleaseAction(app.slug, release.version);
      if (!res.success) {
        setActionError(res.error || "Failed to delete release.");
      }
      router.refresh();
    } catch (err) {
      setActionError(String(err instanceof Error ? err.message : err));
    } finally {
      setBusyVersion(null);
    }
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-[#0E131F] rounded-2xl border border-white/10 overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Source / Storage</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Min OS</th>
                <th className="py-3 px-4">Integrity (SHA-256)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-secondary font-mono">
              {app.releases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-tertiary">
                    <p className="text-sm font-bold text-white font-sans">No releases registered yet</p>
                    <p className="text-xs mt-1">Upload a hosted APK or configure a verified external release.</p>
                  </td>
                </tr>
              ) : (
                app.releases.map((rel) => {
                  const isHosted = Boolean(rel.storagePath || rel.sourceType === "hosted");
                  const isBusy = busyVersion === rel.version;
                  const relStatus = (rel.status || "published").toLowerCase();

                  return (
                    <tr key={rel.version} className="hover:bg-white/[0.02]">
                      {/* Version & Code */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">v{rel.version}</span>
                          {rel.versionCode && (
                            <span className="text-2xs text-text-muted">Code: {rel.versionCode}</span>
                          )}
                          <span className="text-2xs text-text-tertiary mt-0.5">{rel.releaseDate || "—"}</span>
                        </div>
                      </td>

                      {/* Source Channel */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {isHosted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-accent/10 border border-accent/30 text-accent font-semibold self-start">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                              </svg>
                              <span>Hosted Storage</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-text-secondary self-start">
                              <span>External Mirror</span>
                            </span>
                          )}
                          <span className="text-2xs text-text-muted truncate max-w-[140px]" title={rel.sourceName}>
                            {rel.sourceName}
                          </span>
                        </div>
                      </td>

                      {/* File Size */}
                      <td className="py-3 px-4 text-text-primary font-semibold">
                        {formatFileSize(rel.fileSize || rel.fileSizeBytes)}
                      </td>

                      {/* Target/Min OS */}
                      <td className="py-3 px-4">
                        <span>Android {rel.androidMinVersion}+</span>
                        {rel.architectures && (
                          <div className="text-2xs text-text-tertiary mt-0.5">
                            {rel.architectures.join(", ")}
                          </div>
                        )}
                      </td>

                      {/* SHA-256 Checksum & Verification */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={rel.verificationStatus} size="sm" />
                            {isHosted && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleVerifyIntegrity(rel.version)}
                                className="text-2xs text-accent hover:underline cursor-pointer disabled:opacity-50"
                                title="Recalculate and compare SHA-256 against storage file"
                              >
                                Re-check
                              </button>
                            )}
                          </div>
                          {rel.checksumSha256 ? (
                            <div className="flex items-center gap-1 text-2xs text-text-tertiary">
                              <code title={rel.checksumSha256}>
                                {truncateHash(rel.checksumSha256, 8)}
                              </code>
                              <button
                                type="button"
                                onClick={() => copyChecksum(rel.checksumSha256!)}
                                className="hover:text-white transition-colors"
                                title="Copy full SHA-256 hash"
                              >
                                {copiedHash === rel.checksumSha256 ? "✓" : "📋"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-2xs text-rose-400">Missing Hash</span>
                          )}
                        </div>
                      </td>

                      {/* Release Publication Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-2xs uppercase px-2 py-0.5 rounded-full font-bold border ${
                            relStatus === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : relStatus === "archived"
                              ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {relStatus}
                        </span>
                      </td>

                      {/* Action Menu */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test Download */}
                          <a
                            href={`/api/download/release/${encodeURIComponent(rel.version)}?app=${app.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-accent hover:bg-white/5 transition-colors"
                            title="Test secure download route"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>

                          {/* Publish / Archive Toggle */}
                          {relStatus !== "published" ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handlePublish(rel.version)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-2xs font-mono transition-colors disabled:opacity-50"
                              title="Publish release for public download"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleArchive(rel.version)}
                              className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 text-2xs font-mono transition-colors disabled:opacity-50"
                              title="Archive release from public access"
                            >
                              Archive
                            </button>
                          )}

                          {/* Delete Action */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDelete(rel)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                            title={relStatus === "published" ? "Archive first before deleting" : "Permanently delete release"}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVerify && (
        <VerifyReleaseDialog
          isOpen={true}
          appSlug={app.slug}
          releaseVersion={selectedVerify.version}
          onClose={() => setSelectedVerify(null)}
          onSuccess={() => router.refresh()}
        />
      )}

      {selectedRevoke && (
        <RevokeReleaseDialog
          isOpen={true}
          appSlug={app.slug}
          releaseVersion={selectedRevoke.version}
          onClose={() => setSelectedRevoke(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
