"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Game } from "@/types/game";

export type GameLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface GameLogoProps {
  game: Pick<Game, "name" | "slug"> & { iconUrl?: string | null };
  size?: GameLogoSize;
  className?: string;
  priority?: boolean;
}

const SIZE_MAP: Record<
  GameLogoSize,
  { dimension: number; containerClass: string; textClass: string; badgePadding: string }
> = {
  xs: {
    dimension: 18,
    containerClass: "w-[18px] h-[18px] rounded",
    textClass: "text-[8px]",
    badgePadding: "p-0.5",
  },
  sm: {
    dimension: 24,
    containerClass: "w-6 h-6 rounded-md",
    textClass: "text-[10px]",
    badgePadding: "p-0.5",
  },
  md: {
    dimension: 36,
    containerClass: "w-9 h-9 rounded-lg",
    textClass: "text-xs",
    badgePadding: "p-1",
  },
  lg: {
    dimension: 48,
    containerClass: "w-12 h-12 rounded-xl",
    textClass: "text-sm",
    badgePadding: "p-1.5",
  },
  xl: {
    dimension: 64,
    containerClass: "w-16 h-16 rounded-2xl",
    textClass: "text-base",
    badgePadding: "p-2",
  },
};

/** Brand accents for fallback monogram representation */
const GAME_BRAND_THEMES: Record<string, { bg: string; text: string; border: string; monogram: string }> = {
  "pubg-mobile": {
    bg: "from-amber-950/80 to-amber-900/40",
    text: "text-amber-400",
    border: "border-amber-500/40",
    monogram: "PUBG",
  },
  "pubg-mobile-kr": {
    bg: "from-blue-950/80 to-indigo-900/40",
    text: "text-blue-400",
    border: "border-blue-500/40",
    monogram: "KR",
  },
  "call-of-duty-mobile": {
    bg: "from-yellow-950/80 to-stone-900/40",
    text: "text-amber-300",
    border: "border-amber-400/40",
    monogram: "CODM",
  },
  efootball: {
    bg: "from-blue-950/80 to-cyan-900/40",
    text: "text-yellow-400",
    border: "border-yellow-400/40",
    monogram: "EF",
  },
  "mobile-legends": {
    bg: "from-indigo-950/80 to-blue-900/40",
    text: "text-yellow-300",
    border: "border-yellow-400/40",
    monogram: "MLBB",
  },
  "free-fire": {
    bg: "from-orange-950/80 to-red-900/40",
    text: "text-orange-400",
    border: "border-orange-500/40",
    monogram: "FF",
  },
};

export function GameLogo({
  game,
  size = "md",
  className,
  priority = false,
}: GameLogoProps) {
  const [imgError, setImgError] = React.useState(false);

  const { dimension, containerClass, textClass } = SIZE_MAP[size];
  const theme = GAME_BRAND_THEMES[game.slug] ?? {
    bg: "from-zinc-900 to-zinc-800",
    text: "text-accent",
    border: "border-border-default",
    monogram: game.name.slice(0, 2).toUpperCase(),
  };

  // Resolve image source: custom iconUrl, or canonical local vector
  const imageSrc = !imgError
    ? game.iconUrl || `/images/games/${game.slug}.svg`
    : null;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 flex items-center justify-center overflow-hidden border shadow-sm transition-transform",
        containerClass,
        theme.border,
        `bg-gradient-to-br ${theme.bg}`,
        className
      )}
      title={game.name}
      aria-label={`${game.name} logo`}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={`${game.name} icon`}
          width={dimension}
          height={dimension}
          priority={priority}
          className="w-full h-full object-cover rounded-[inherit]"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className={cn(
            "font-mono font-black tracking-wider uppercase select-none",
            textClass,
            theme.text
          )}
        >
          {theme.monogram}
        </span>
      )}
    </div>
  );
}
