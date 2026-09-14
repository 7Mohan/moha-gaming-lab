import * as React from "react";
import Link from "next/link";
import { getAllGames } from "@/lib/services/game-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { AdminGamesClient } from "@/components/admin/games/AdminGamesClient";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  const games = await getAllGames();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <Breadcrumb items={[{ label: "Games" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Games Management
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Configure hardware tiers, optimization profiles, and performance telemetry for Android games.
            </p>
          </div>
          <Link
            href="/admin/games/new"
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs font-mono shadow-lg shadow-primary/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Register New Game</span>
          </Link>
        </div>
      </div>

      {/* Client Table */}
      <AdminGamesClient games={games} />
    </div>
  );
}
