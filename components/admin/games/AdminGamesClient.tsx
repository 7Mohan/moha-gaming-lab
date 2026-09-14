"use client";

import * as React from "react";
import Link from "next/link";
import { AdminTable, type Column, type BulkAction } from "@/components/admin/ui/AdminTable";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { bulkArchiveGamesAction } from "@/app/admin/(dashboard)/games/actions";
import type { Game } from "@/types/game";

interface AdminGamesClientProps {
  games: Game[];
}

export function AdminGamesClient({ games }: AdminGamesClientProps) {
  const columns: Column<Game>[] = [
    {
      key: "name",
      header: "Game Title",
      sortable: true,
      render: (g) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-primary flex-shrink-0">
            {g.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/games/${g.id}`}
              className="font-bold text-white hover:text-primary transition-colors block truncate"
            >
              {g.name}
            </Link>
            <span className="text-[11px] font-mono text-text-tertiary block truncate">
              /{g.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "platform",
      header: "Platform",
      sortable: true,
      render: (g) => (
        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-secondary">
          {g.platform}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (g) => (
        <span className="text-xs text-text-secondary capitalize">
          {g.category.replace(/-/g, " ")}
        </span>
      ),
    },
    {
      key: "deviceTier",
      header: "Device Tier",
      sortable: true,
      render: (g) => {
        const tierColors = {
          low: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          mid: "text-blue-400 bg-blue-500/10 border-blue-500/20",
          high: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        };
        const color = tierColors[g.deviceTier] || "text-text-secondary";
        return (
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${color}`}>
            {g.deviceTier}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (g) => (
        <StatusBadge
          status={g.status === "active" ? "PUBLISHED" : g.status?.toUpperCase() || "DRAFT"}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (g) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/games/${g.slug}`}
            target="_blank"
            className="p-1.5 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors"
            title="View public page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <Link
            href={`/admin/games/${g.id}`}
            className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-colors"
          >
            Edit
          </Link>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction<Game>[] = [
    {
      label: "Archive Selected",
      variant: "danger",
      action: async (selected) => {
        await bulkArchiveGamesAction(selected.map((g) => g.id));
      },
    },
  ];

  return (
    <AdminTable
      data={games}
      columns={columns}
      rowKey={(g) => g.id}
      searchPlaceholder="Search games by title, slug, or tag..."
      searchFilter={(g, q) =>
        g.name.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
      }
      bulkActions={bulkActions}
      initialSortKey="name"
      emptyTitle="No games registered yet"
      emptyDescription="Add your first game profile to configure Android hardware optimizations."
      emptyAction={
        <Link
          href="/admin/games/new"
          className="inline-block py-2 px-4 rounded-xl bg-primary text-black font-bold text-xs"
        >
          Create Game
        </Link>
      }
    />
  );
}
