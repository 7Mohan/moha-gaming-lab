/**
 * lib/services/related-content-service.ts
 * ────────────────────────────────────────────────────────────────
 * Deterministic multi-factor related content ranking engine.
 *
 * Scoring factors:
 *  1. Direct relational link (+20)
 *  2. Shared game reference (+15)
 *  3. Category affinity (+10)
 *  4. Tag overlap (+4 per shared tag)
 *  5. Content status constraint (only published items returned)
 */

import { gameRepository, appRepository, toolRepository, guideRepository } from "../repositories";
import type { Game } from "@/types/game";
import type { App } from "@/types/app";
import type { Tool } from "@/types/tool";
import type { Guide } from "@/types/guide";

export interface RelatedContentResults {
  games: Game[];
  tools: Tool[];
  apps: App[];
  guides: Guide[];
}

export interface RelatedContentOptions {
  limitPerSection?: number;
}

export async function getRelatedContentForGame(
  gameSlug: string,
  options: RelatedContentOptions = {}
): Promise<RelatedContentResults> {
  const limit = options.limitPerSection ?? 3;
  const game = await gameRepository.getBySlug(gameSlug);
  if (!game) return { games: [], tools: [], apps: [], guides: [] };

  const [allGames, allTools, allApps, allGuides] = await Promise.all([
    gameRepository.listAll(),
    toolRepository.listAll(),
    appRepository.listAll(),
    guideRepository.listAll(),
  ]);

  // Related games (same category or shared tags, excluding self)
  const relatedGames = allGames
    .filter((g) => g.slug !== game.slug && g.status === "active")
    .map((g) => {
      let score = 0;
      if (g.category === game.category) score += 10;
      score += g.tags.filter((t) => game.tags.includes(t)).length * 4;
      return { item: g, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);

  // Related tools (explicitly listed or shared tags)
  const relatedTools = allTools
    .filter((t) => t.status === "available" || t.status === "beta")
    .map((t) => {
      let score = 0;
      if (game.relatedToolSlugs?.includes(t.slug) || t.relatedGameSlugs?.includes(game.slug)) {
        score += 20;
      }
      score += t.tags.filter((tag) => game.tags.includes(tag)).length * 4;
      return { item: t, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);

  // Related apps (compatible with this game or shared gaming utility tags)
  const relatedApps = allApps
    .filter((a) => a.status === "active")
    .map((a) => {
      let score = 0;
      if (a.relatedGames?.includes(game.slug)) score += 20;
      score += a.tags.filter((t) => game.tags.includes(t)).length * 4;
      return { item: a, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);

  // Related guides (referencing this game or shared topics)
  const relatedGuides = allGuides
    .filter((gu) => gu.status === "published")
    .map((gu) => {
      let score = 0;
      if (gu.gameIds?.includes(game.slug) || game.relatedGuideSlugs?.includes(gu.slug)) {
        score += 20;
      }
      score += gu.tags.filter((t) => game.tags.includes(t)).length * 4;
      return { item: gu, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);

  return {
    games: relatedGames,
    tools: relatedTools,
    apps: relatedApps,
    guides: relatedGuides,
  };
}

export async function getRelatedContentForGuide(
  guideSlug: string,
  options: RelatedContentOptions = {}
): Promise<RelatedContentResults> {
  const limit = options.limitPerSection ?? 3;
  const guide = await guideRepository.getBySlug(guideSlug);
  if (!guide) return { games: [], tools: [], apps: [], guides: [] };

  const [allGames, allTools, allApps, allGuides] = await Promise.all([
    gameRepository.listAll(),
    toolRepository.listAll(),
    appRepository.listAll(),
    guideRepository.listAll(),
  ]);

  const relatedGames = allGames
    .filter((g) => g.status === "active")
    .map((g) => {
      let score = 0;
      if (guide.gameIds?.includes(g.slug)) score += 20;
      score += g.tags.filter((t) => guide.tags.includes(t)).length * 4;
      return { item: g, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);

  const relatedTools = allTools
    .filter((t) => t.status === "available" || t.status === "beta")
    .map((t) => {
      let score = 0;
      if (guide.toolIds?.includes(t.slug)) score += 20;
      score += t.tags.filter((tag) => guide.tags.includes(tag)).length * 4;
      return { item: t, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);

  const relatedApps = allApps
    .filter((a) => a.status === "active")
    .map((a) => {
      let score = 0;
      if (guide.appIds?.includes(a.slug)) score += 20;
      score += a.tags.filter((t) => guide.tags.includes(t)).length * 4;
      return { item: a, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);

  const relatedGuides = allGuides
    .filter((gu) => gu.slug !== guide.slug && gu.status === "published")
    .map((gu) => {
      let score = 0;
      if (guide.relatedGuideSlugs?.includes(gu.slug)) score += 20;
      if (gu.category === guide.category) score += 10;
      score += gu.tags.filter((t) => guide.tags.includes(t)).length * 4;
      return { item: gu, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);

  return {
    games: relatedGames,
    tools: relatedTools,
    apps: relatedApps,
    guides: relatedGuides,
  };
}
