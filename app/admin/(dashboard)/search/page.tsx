import * as React from "react";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { AdminSearchClient } from "@/components/admin/search/AdminSearchClient";

export const dynamic = "force-dynamic";

export default function AdminSearchPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Global Search" }]} />

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Global Ecosystem Search
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Instant multi-entity search across published, review, draft, and archived records.
        </p>
      </div>

      <AdminSearchClient />
    </div>
  );
}
