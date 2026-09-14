import type { Metadata } from "next";

/** Supported gaming platforms */
export type Platform = "android" | "ios" | "cross-platform";

/** Game genre categories */
export type GameCategory =
  | "battle-royale"
  | "fps"
  | "moba"
  | "rpg"
  | "strategy"
  | "sports"
  | "racing"
  | "action"
  | "other";

/** Performance areas the platform covers for this game */
export type PerformanceArea =
  | "fps"
  | "frame-time"
  | "touch-latency"
  | "thermal"
  | "network"
  | "graphics"
  | "battery"
  | "stability"
  | "memory";

/** Difficulty of applying a recommendation */
export type Difficulty = "easy" | "moderate" | "advanced";

/** Risk level of an optimization */
export type RiskLevel = "low" | "medium" | "high";

/** Optimization category grouping */
export type OptimizationCategory =
  | "graphics"
  | "performance"
  | "touch"
  | "network"
  | "thermal"
  | "battery";

/** A single optimization recommendation */
export interface OptimizationRecommendation {
  id: string;
  category: OptimizationCategory;
  title: string;
  description: string;
  difficulty: Difficulty;
  /** Risk of applying this tweak */
  risk: RiskLevel;
  /** Whether root access is required */
  requiresRoot?: boolean;
}

/** A known performance problem for a game */
export interface CommonProblem {
  id: string;
  title: string;
  /** Brief explanation of what this problem means */
  what: string;
  /** Technical or environmental causes */
  causes: string[];
  /** Actionable user steps */
  steps: string[];
  /** Related tool slugs */
  relatedToolSlugs?: string[];
  /** Related guide slugs */
  relatedGuideSlugs?: string[];
}

/** A game entry in the platform */
export interface Game {
  id: string;
  name: string;
  /** Alternative names / regional titles */
  altNames?: string[];
  slug: string;
  platform: Platform;
  category: GameCategory;
  description: string;
  /** Short one-liner for card previews */
  excerpt: string;
  /** Relative image path — null until icon is available */
  iconUrl: string | null;
  /** Cover/banner image — null until available */
  coverUrl?: string | null;
  coverImage?: string | null;
  /** Minimum supported Android version e.g. "8.0" */
  minAndroidVersion?: string;
  /** Recommended device tier: low | mid | high */
  deviceTier: "low" | "mid" | "high";
  /** Which performance areas the platform addresses for this game */
  performanceAreas: PerformanceArea[];
  featured: boolean;
  /** Status: active = full page, draft = stub, archived = hidden/deprecated */
  status: "active" | "draft" | "archived";
  /** Optimization guide slug if one exists */
  guideSlug?: string;
  /** Slugs of related tools */
  relatedToolSlugs: string[];
  /** Slugs of related apps */
  relatedAppSlugs: string[];
  /** Slugs of related guides */
  relatedGuideSlugs: string[];
  /** Common performance problems users encounter */
  commonProblems: CommonProblem[];
  /** Optimization recommendations */
  optimizationRecs: OptimizationRecommendation[];
  tags: string[];
  /** ISO date when this game profile was last updated */
  updatedAt?: string;
}

/** Open Graph metadata for game pages */
export function buildGameOgTitle(game: Pick<Game, "name">): string {
  return `${game.name} Android Performance Guide | Moha Gaming Lab`;
}

export function buildGameOgDescription(game: Pick<Game, "name" | "description">): string {
  return game.description.length > 155
    ? `${game.description.slice(0, 152)}…`
    : game.description;
}

/** Structured metadata suitable for Next.js generateMetadata */
export function buildGameMetadata(game: Game): Metadata {
  return {
    title: buildGameOgTitle(game),
    description: buildGameOgDescription(game),
    alternates: { canonical: `/games/${game.slug}` },
    openGraph: {
      title: buildGameOgTitle(game),
      description: buildGameOgDescription(game),
      url: `/games/${game.slug}`,
    },
  };
}
