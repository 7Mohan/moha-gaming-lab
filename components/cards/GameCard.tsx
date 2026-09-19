import Link from "next/link";
import type { Game } from "@/types/game";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PERFORMANCE_AREA_LABELS, CATEGORY_LABELS } from "@/lib/games";
import { ArrowRight } from "lucide-react";
import { GameLogo } from "@/components/games/GameLogo";

interface GameCardProps {
  game: Game;
}

const tierVariant = {
  low: "success",
  mid: "warning",
  high: "error",
} as const;

/** Icon glyph for each performance area — SVG paths, no external icon lib needed */
function PerformanceDot({ area }: { area: Game["performanceAreas"][number] }) {
  const dotColors: Record<typeof area, string> = {
    fps: "#00E5A0",
    "frame-time": "#A78BFA",
    "touch-latency": "#60A5FA",
    thermal: "#F97316",
    network: "#38BDF8",
    graphics: "#F59E0B",
    battery: "#34D399",
    stability: "#00E5A0",
    memory: "#E879F9",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: dotColors[area] ?? "#525C68",
        flexShrink: 0,
      }}
      title={PERFORMANCE_AREA_LABELS[area]}
      aria-hidden="true"
    />
  );
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Card as="article" interactive variant="surface" className="h-full">
      <Link
        href={`/games/${game.slug}`}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-md p-4 flex flex-col justify-between gap-4"
        aria-label={`${game.name} — ${game.excerpt}`}
      >
        {/* Top section */}
        <div className="flex flex-col gap-3">
          {/* Game icon + title */}
          <div className="flex items-start gap-3">
            <GameLogo game={game} size="lg" priority />

            <div className="min-w-0 flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-text-primary leading-snug">
                {game.name}
              </h3>
              <span className="text-2xs font-mono text-text-muted">
                {CATEGORY_LABELS[game.category]} &middot; {game.platform === "android" ? "Android" : game.platform}
              </span>
            </div>
          </div>

          {/* Excerpt */}
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
            {game.excerpt}
          </p>

          {/* Performance focus dots */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              Focus:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {game.performanceAreas.slice(0, 5).map((area) => (
                <span
                  key={area}
                  className="flex items-center gap-1 text-[10px] font-mono text-text-muted"
                >
                  <PerformanceDot area={area} />
                  {PERFORMANCE_AREA_LABELS[area]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={tierVariant[game.deviceTier]} size="sm">
              {game.deviceTier.toUpperCase()}
            </Badge>
            {game.guideSlug && (
              <Badge variant="accent" size="sm">Guide</Badge>
            )}
          </div>
          <span className="text-2xs font-mono font-semibold text-accent flex items-center gap-1">
            View
            <ArrowRight size={11} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </Card>
  );
}
