import * as React from "react";
import Link from "next/link";
import { getAllTools } from "@/lib/services/tool-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { AdminToolsClient } from "@/components/admin/tools/AdminToolsClient";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const tools = await getAllTools();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[{ label: "Tools" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Diagnostic Tools Hub
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Browser-based gaming performance tools, display benchmarks, and sensor diagnostics.
            </p>
          </div>
          <Link
            href="/admin/tools/new"
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Register Diagnostic Tool</span>
          </Link>
        </div>
      </div>

      <AdminToolsClient tools={tools} />
    </div>
  );
}
