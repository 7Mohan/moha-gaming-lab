import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { getPublishedGames } from "@/lib/services/game-service";
import { GameHubClient } from "@/components/games/GameHubClient";

export const metadata: Metadata = buildMetadata({
  title: "Games",
  description:
    "Performance guides, optimization tools, and Android settings for popular mobile games — PUBG Mobile, Call of Duty, eFootball, Mobile Legends, and more.",
  path: "/games",
});

export default async function GamesPage() {
  const { items: games } = await getPublishedGames();

  return (
    <>
      {/* ── Page header ── */}
      <div className="border-b border-border-subtle bg-bg-surface">
        <div className="container-content py-12 flex flex-col gap-3">
          <span className="label-mono">Games</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Android Game Library
          </h1>
          <p className="text-text-secondary leading-relaxed max-w-xl">
            Performance guides, settings, and diagnostic tools for popular Android
            titles. Find your game to understand what&apos;s limiting your FPS and how to address it.
          </p>
        </div>
      </div>

      {/* ── Search + grid (client island) ── */}
      <div className="container-content section">
        <GameHubClient games={games} />
      </div>
    </>
  );
}
