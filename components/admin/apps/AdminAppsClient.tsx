"use client";

import * as React from "react";
import Link from "next/link";
import { AdminTable, type Column } from "@/components/admin/ui/AdminTable";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import type { App } from "@/types/app";

interface AdminAppsClientProps {
  apps: App[];
}

export function AdminAppsClient({ apps }: AdminAppsClientProps) {
  const columns: Column<App>[] = [
    {
      key: "name",
      header: "Application",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center font-mono font-bold text-xs text-accent flex-shrink-0">
            {a.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/apps/${a.id}`}
              className="font-bold text-white hover:text-accent transition-colors block truncate"
            >
              {a.name}
            </Link>
            <span className="text-[11px] font-mono text-text-tertiary block truncate">
              {a.packageName || `/${a.slug}`}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (a) => <span className="text-xs text-text-secondary">{a.category}</span>,
    },
    {
      key: "requiresRoot",
      header: "Root Required",
      sortable: true,
      render: (a) =>
        a.requiresRoot ? (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
            Root Required
          </span>
        ) : (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-tertiary">
            No Root
          </span>
        ),
    },
    {
      key: "releases",
      header: "Latest Release",
      render: (a) => {
        const latest = a.releases?.[0];
        if (!latest) return <span className="text-text-tertiary text-xs font-mono">—</span>;
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white font-semibold">
              v{latest.version}
            </span>
            <StatusBadge status={latest.verificationStatus} size="sm" />
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (a) => (
        <StatusBadge
          status={a.status === "active" ? "PUBLISHED" : a.status?.toUpperCase() || "DRAFT"}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/apps/${a.slug}`}
            target="_blank"
            className="p-1.5 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors"
            title="View public page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <Link
            href={`/admin/apps/${a.id}/releases`}
            className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-text-secondary hover:text-white transition-colors"
          >
            Releases ({a.releases?.length || 0})
          </Link>
          <Link
            href={`/admin/apps/${a.id}`}
            className="py-1 px-2.5 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 text-xs font-mono text-accent transition-colors"
          >
            Edit
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AdminTable
      data={apps}
      columns={columns}
      rowKey={(a) => a.id}
      searchPlaceholder="Search apps by name, package name, or developer..."
      searchFilter={(a, q) =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.packageName && a.packageName.toLowerCase().includes(q)) ||
        a.developer.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      }
      initialSortKey="name"
      emptyTitle="No Android applications registered yet"
      emptyDescription="Add APK optimization packages to start serving verified downloads."
      emptyAction={
        <Link
          href="/admin/apps/new"
          className="inline-block py-2 px-4 rounded-xl bg-accent text-black font-bold text-xs"
        >
          Register App
        </Link>
      }
    />
  );
}
