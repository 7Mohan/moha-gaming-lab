import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppById, getAppBySlug } from "@/lib/services/app-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { ReleasesList } from "@/components/admin/apps/ReleasesList";

export const dynamic = "force-dynamic";

interface ReleasesPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReleasesPage({ params }: ReleasesPageProps) {
  const { id } = await params;

  let app = await getAppById(id);
  if (!app) {
    app = await getAppBySlug(id);
  }

  if (!app) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Apps", href: "/admin/apps" },
          { label: app.name, href: `/admin/apps/${app.id}` },
          { label: "Releases" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Releases & Download Artifacts
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              {app.name}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Publish versioned APK releases, configure SHA-256 checksums, and record explicit verification evidence.
          </p>
        </div>

        <Link
          href={`/admin/apps/${app.id}/releases/new`}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-accent hover:bg-accent/90 text-black font-bold text-xs font-mono shadow-lg shadow-accent/20 transition-all self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Publish New Version</span>
        </Link>
      </div>

      <ReleasesList app={app} />
    </div>
  );
}
