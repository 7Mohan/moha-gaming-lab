import type { Game, GameCategory, PerformanceArea, Platform } from "@/types/game";

/* ── Filter shape ─────────────────────────────────────────── */

export interface GameFilters {
  query: string;
  platform: Platform | "all";
  category: GameCategory | "all";
  performanceArea: PerformanceArea | "all";
}

export const DEFAULT_FILTERS: GameFilters = {
  query: "",
  platform: "all",
  category: "all",
  performanceArea: "all",
};

/* ── Normalise text for fuzzy matching ───────────────────── */

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

/* ── Core search/filter function ─────────────────────────── */

/**
 * Filter games by search query and categorical filters.
 * All filtering is done in-memory; no external dependencies needed.
 *
 * Search checks: name, altNames, excerpt, description, category, tags
 */
export function filterGames(games: Game[], filters: GameFilters): Game[] {
  const { query, platform, category, performanceArea } = filters;
  const normQuery = normalise(query);

  return games.filter((game) => {
    // --- Categorical filters (fast path first) ---
    if (platform !== "all" && game.platform !== platform) return false;
    if (category !== "all" && game.category !== category) return false;
    if (performanceArea !== "all" && !game.performanceAreas.includes(performanceArea)) return false;

    // --- Text search ---
    if (!normQuery) return true;

    const searchTargets = [
      game.name,
      ...(game.altNames ?? []),
      game.excerpt,
      game.description,
      game.category,
      ...game.tags,
    ].map(normalise).join(" ");

    return normQuery.split(" ").every((word) => searchTargets.includes(word));
  });
}

/* ── Label maps (for UI rendering) ──────────────────────── */

export const CATEGORY_LABELS: Record<GameCategory | "all", string> = {
  all: "All Genres",
  "battle-royale": "Battle Royale",
  fps: "FPS / Shooter",
  moba: "MOBA",
  rpg: "RPG",
  strategy: "Strategy",
  sports: "Sports",
  racing: "Racing",
  action: "Action",
  other: "Other",
};

export const PERFORMANCE_AREA_LABELS: Record<PerformanceArea | "all", string> = {
  all: "All Focus Areas",
  fps: "FPS",
  "frame-time": "Frame Time",
  "touch-latency": "Touch Latency",
  thermal: "Thermal",
  network: "Network",
  graphics: "Graphics",
  battery: "Battery",
  stability: "Stability",
  memory: "Memory",
};

export const PLATFORM_LABELS: Record<Platform | "all", string> = {
  all: "All Platforms",
  android: "Android",
  ios: "iOS",
  "cross-platform": "Cross-platform",
};

/* ── Extract unique values present in a game list ─────── */

export function getAvailableCategories(games: Game[]): Array<GameCategory | "all"> {
  const found = new Set<GameCategory>(games.map((g) => g.category));
  return ["all", ...Array.from(found)];
}

export function getAvailablePerformanceAreas(games: Game[]): Array<PerformanceArea | "all"> {
  const found = new Set<PerformanceArea>();
  games.forEach((g) => g.performanceAreas.forEach((a) => found.add(a)));
  return ["all", ...Array.from(found)];
}
