import * as React from "react";
import Link from "next/link";
import { getAllApps } from "@/lib/services/app-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { AdminAppsClient } from "@/components/admin/apps/AdminAppsClient";

export const dynamic = "force-dynamic";

export default async function AdminAppsPage() {
  const apps = await getAllApps();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <Breadcrumb items={[{ label: "Apps" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Android Apps Hub
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Curate Android optimization packages, versioned APK releases, and checksum audits.
            </p>
          </div>
          <Link
            href="/admin/apps/new"
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-accent hover:bg-accent/90 text-black font-bold text-xs font-mono shadow-lg shadow-accent/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Register Android App</span>
          </Link>
        </div>
      </div>

      {/* Client Table */}
      <AdminAppsClient apps={apps} />
    </div>
  );
}
