"use client";

import * as React from "react";
import Link from "next/link";
import { AdminTable, type Column } from "@/components/admin/ui/AdminTable";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import type { Tool } from "@/types/tool";

interface AdminToolsClientProps {
  tools: Tool[];
}

export function AdminToolsClient({ tools }: AdminToolsClientProps) {
  const columns: Column<Tool>[] = [
    {
      key: "name",
      header: "Tool Name",
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 flex-shrink-0">
            {t.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/tools/${t.id}`}
              className="font-bold text-white hover:text-cyan-400 transition-colors block truncate"
            >
              {t.name}
            </Link>
            <span className="text-[11px] font-mono text-text-tertiary block truncate">
              /tools/{t.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (t) => (
        <span className="text-xs text-text-secondary capitalize">
          {t.category.replace(/-/g, " ")}
        </span>
      ),
    },
    {
      key: "platforms",
      header: "Platforms",
      render: (t) => (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-secondary uppercase">
          {t.platforms?.join(", ") || "web"}
        </span>
      ),
    },
    {
      key: "difficulty",
      header: "Difficulty",
      sortable: true,
      render: (t) => (
        <span className="text-xs text-text-secondary capitalize">{t.difficulty}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (t) => (
        <StatusBadge
          status={t.status === "available" ? "PUBLISHED" : t.status.toUpperCase()}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (t) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/tools/${t.slug}`}
            target="_blank"
            className="p-1.5 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors"
            title="Open tool in new tab"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <Link
            href={`/admin/tools/${t.id}`}
            className="py-1 px-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-mono text-cyan-400 transition-colors"
          >
            Configure
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AdminTable
      data={tools}
      columns={columns}
      rowKey={(t) => t.id}
      searchPlaceholder="Search tools by title, category, or capability..."
      searchFilter={(t, q) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q)
      }
      initialSortKey="name"
      emptyTitle="No diagnostic tools configured"
      emptyDescription="Register a browser benchmark or testing suite to monitor hardware."
      emptyAction={
        <Link
          href="/admin/tools/new"
          className="inline-block py-2 px-4 rounded-xl bg-cyan-500 text-black font-bold text-xs"
        >
          Create Tool
        </Link>
      }
    />
  );
}
