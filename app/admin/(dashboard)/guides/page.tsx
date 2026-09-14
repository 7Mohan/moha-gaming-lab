import * as React from "react";
import Link from "next/link";
import { getAllGuides } from "@/lib/services/guide-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { AdminGuidesClient } from "@/components/admin/guides/AdminGuidesClient";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  const guides = await getAllGuides();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[{ label: "Guides" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">
              Guides & Knowledge Hub
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Author deep-dive tutorials, thermal diagnosis walkthroughs, and editorial reviews.
            </p>
          </div>
          <Link
            href="/admin/guides/new"
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-bg-base font-bold text-xs font-mono shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Author New Guide</span>
          </Link>
        </div>
      </div>

      <AdminGuidesClient guides={guides} />
    </div>
  );
}
