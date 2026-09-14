"use client";

import * as React from "react";
import Link from "next/link";
import { AdminTable, type Column } from "@/components/admin/ui/AdminTable";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import type { Guide } from "@/types/guide";

interface AdminGuidesClientProps {
  guides: Guide[];
}

export function AdminGuidesClient({ guides }: AdminGuidesClientProps) {
  const columns: Column<Guide>[] = [
    {
      key: "title",
      header: "Guide Title",
      sortable: true,
      render: (g) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 flex-shrink-0">
            {g.title.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/guides/${g.id}`}
              className="font-bold text-text-primary hover:text-emerald-400 transition-colors block truncate"
            >
              {g.title}
            </Link>
            <span className="text-[11px] font-mono text-text-tertiary block truncate">
              /guides/{g.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (g) => <span className="text-xs text-text-secondary">{g.category}</span>,
    },
    {
      key: "difficulty",
      header: "Difficulty",
      sortable: true,
      render: (g) => {
        const diffColors: Record<string, string> = {
          beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          intermediate: "text-blue-400 bg-blue-500/10 border-blue-500/20",
          advanced: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        };
        const color = diffColors[g.difficulty.toLowerCase()] || "text-text-secondary";
        return (
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${color}`}>
            {g.difficulty}
          </span>
        );
      },
    },
    {
      key: "readingTimeMinutes",
      header: "Read Time",
      sortable: true,
      render: (g) => (
        <span className="text-xs font-mono text-text-tertiary">
          {g.readingTimeMinutes} min
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (g) => <StatusBadge status={g.status.toUpperCase()} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (g) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/guides/${g.slug}`}
            target="_blank"
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
            title="View published article"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <Link
            href={`/admin/guides/${g.id}/preview`}
            className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
          >
            Preview
          </Link>
          <Link
            href={`/admin/guides/${g.id}`}
            className="py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-mono text-emerald-400 transition-colors"
          >
            Edit
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AdminTable
      data={guides}
      columns={columns}
      rowKey={(g) => g.id}
      searchPlaceholder="Search guides by title, category, or keyword..."
      searchFilter={(g, q) =>
        g.title.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.excerpt.toLowerCase().includes(q)
      }
      initialSortKey="title"
      emptyTitle="No guides authored yet"
      emptyDescription="Create your first tutorial to enrich the Moha Gaming Lab knowledge base."
      emptyAction={
        <Link
          href="/admin/guides/new"
          className="inline-block py-2 px-4 rounded-xl bg-emerald-500 text-bg-base font-bold text-xs"
        >
          Create Guide
        </Link>
      }
    />
  );
}
