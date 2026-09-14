import * as React from "react";
import Link from "next/link";
import { getAllApps } from "@/lib/services/app-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";

export const dynamic = "force-dynamic";

interface FlatDownloadRecord {
  appId: string;
  appName: string;
  appSlug: string;
  version: string;
  sourceName: string;
  sourceType: string;
  downloadUrl?: string;
  sourceUrl?: string;
  checksumSha256?: string;
  verificationStatus: string;
  releaseDate: string;
}

export default async function AdminDownloadsPage() {
  const apps = await getAllApps();

  const downloads: FlatDownloadRecord[] = [];
  apps.forEach((app) => {
    app.releases.forEach((rel) => {
      downloads.push({
        appId: app.id,
        appName: app.name,
        appSlug: app.slug,
        version: rel.version,
        sourceName: rel.sourceName || "Official",
        sourceType: rel.sourceType || "github_release",
        downloadUrl: rel.downloadUrl,
        sourceUrl: rel.sourceUrl,
        checksumSha256: rel.checksumSha256,
        verificationStatus: rel.verificationStatus,
        releaseDate: rel.releaseDate,
      });
    });
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Downloads & Mirrors" }]} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Download Sources & Mirrors Audit
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Global repository of verified mirror endpoints, external APK downloads, and cryptographic signatures.
          </p>
        </div>
        <span className="text-xs font-mono text-text-tertiary px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 self-start sm:self-auto">
          {downloads.length} active download mirrors
        </span>
      </div>

      <div className="bg-[#0E131F] rounded-2xl border border-white/10 overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-text-tertiary">
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Source Provider</th>
                <th className="py-3 px-4">Direct URL</th>
                <th className="py-3 px-4">SHA-256 Checksum</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-secondary">
              {downloads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-tertiary font-sans">
                    No download mirrors registered yet. Add a release to an app to populate mirrors.
                  </td>
                </tr>
              ) : (
                downloads.map((dl, idx) => (
                  <tr key={`${dl.appSlug}-${dl.version}-${idx}`} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-white font-sans">
                      <Link
                        href={`/admin/apps/${dl.appId}`}
                        className="hover:text-accent transition-colors"
                      >
                        {dl.appName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-white">v{dl.version}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-secondary text-[11px]">
                        {dl.sourceName}
                      </span>
                    </td>
                    <td className="py-3 px-4 truncate max-w-xs text-text-tertiary">
                      {dl.downloadUrl ? (
                        <a
                          href={dl.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary underline flex items-center gap-1"
                        >
                          <span className="truncate">{dl.downloadUrl}</span>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 truncate max-w-[10rem] text-[10px] text-text-tertiary">
                      {dl.checksumSha256 || "No Checksum"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={dl.verificationStatus} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/apps/${dl.appId}/releases`}
                        className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-text-secondary hover:text-white transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
