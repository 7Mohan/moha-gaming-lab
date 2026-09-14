/**
 * lib/search-index.ts
 * ────────────────────────────────────────────────────────────────
 * Normalized flat search document index for Moha Gaming Lab.
 *
 * This layer separates the search engine from the internal structure
 * of each content section. All entities are flattened into a common
 * SearchDocument shape, making future migration to:
 *
 *   PostgreSQL / Supabase / Algolia / Typesense / Meilisearch / OpenSearch
 *
 * significantly simpler — just POST these documents to the external
 * index instead of running the local engine.
 *
 * Current document count: ~33 (6 games + 13 tools + 8 apps + 6 guides)
 */

import { games } from "@/data/games";
import { tools } from "@/data/tools";
import { apps } from "@/data/apps";
import { guides } from "@/data/guides";

/* ── Normalized search document ──────────────────────────────── */

export type SearchEntityType = "game" | "tool" | "app" | "guide";

export interface SearchDocument {
  /** Stable unique identifier, e.g. "game:pubg-mobile" */
  id: string;
  /** Content section type */
  type: SearchEntityType;
  /** Display title — highest search priority field */
  title: string;
  /** Alternative names / aliases for matching */
  aliases: string[];
  /** Short description for result cards */
  description: string;
  /** Destination URL */
  href: string;
  /** URL slug */
  slug: string;
  /** Searchable keyword tags */
  tags: string[];
  /** Primary category label */
  category: string;
  /** Secondary subtitle shown below title in results */
  subtitle: string;
  /** Related entity slugs — for cross-content discovery */
  relatedGameSlugs: string[];
  relatedToolSlugs: string[];
  relatedGuideSlugs: string[];
  /** Metadata badges shown on result cards */
  badges: string[];
}

import type { Game } from "@/types/game";
import type { Tool } from "@/types/tool";
import type { App } from "@/types/app";
import type { Guide } from "@/types/guide";

/* ── Runtime Search Stores ─────────────────────────────────── */
const searchGamesStore: Game[] = [...games];
const searchToolsStore: Tool[] = [...tools];
const searchAppsStore: App[] = [...apps];
const searchGuidesStore: Guide[] = [...guides];

export function registerGameForSearch(game: Game) {
  const idx = searchGamesStore.findIndex((g) => g.id === game.id || g.slug === game.slug);
  if (idx >= 0) {
    searchGamesStore[idx] = { ...searchGamesStore[idx], ...game };
  } else {
    searchGamesStore.unshift(game);
  }
  invalidateSearchIndex();
}

export function registerToolForSearch(tool: Tool) {
  const idx = searchToolsStore.findIndex((t) => t.id === tool.id || t.slug === tool.slug);
  if (idx >= 0) {
    searchToolsStore[idx] = { ...searchToolsStore[idx], ...tool };
  } else {
    searchToolsStore.unshift(tool);
  }
  invalidateSearchIndex();
}

export function registerAppForSearch(app: App) {
  const idx = searchAppsStore.findIndex((a) => a.id === app.id || a.slug === app.slug);
  if (idx >= 0) {
    searchAppsStore[idx] = { ...searchAppsStore[idx], ...app };
  } else {
    searchAppsStore.unshift(app);
  }
  invalidateSearchIndex();
}

export function registerGuideForSearch(guide: Guide) {
  const idx = searchGuidesStore.findIndex((g) => g.id === guide.id || g.slug === guide.slug);
  if (idx >= 0) {
    searchGuidesStore[idx] = { ...searchGuidesStore[idx], ...guide };
  } else {
    searchGuidesStore.unshift(guide);
  }
  invalidateSearchIndex();
}

export function getSearchStore() {
  return {
    games: searchGamesStore,
    tools: searchToolsStore,
    apps: searchAppsStore,
    guides: searchGuidesStore,
  };
}

/* ── Build index from each data source ──────────────────────── */

function buildGameDocuments(): SearchDocument[] {
  return searchGamesStore
    .filter((g) => g.status === "active" || (g.status as string) === "published")
    .map((g) => ({
      id: `game:${g.slug}`,
      type: "game" as const,
      title: g.name,
      aliases: g.altNames ?? [],
      description: g.excerpt,
      href: `/games/${g.slug}`,
      slug: g.slug,
      tags: g.tags,
      category: g.category,
      subtitle: `${g.category.replace(/-/g, " ")} · ${
        g.platform === "android" ? "Android" : g.platform === "ios" ? "iOS" : "Cross-platform"
      }`,
      relatedGameSlugs: [],
      relatedToolSlugs: g.relatedToolSlugs ?? [],
      relatedGuideSlugs: [
        ...g.relatedGuideSlugs,
        ...(g.guideSlug ? [g.guideSlug] : []),
      ],
      badges: [g.deviceTier.toUpperCase(), ...(g.guideSlug ? ["Guide"] : [])],
    }));
}

function buildToolDocuments(): SearchDocument[] {
  return searchToolsStore
    .filter((t) => t.status === "available" || t.status === "beta")
    .map((t) => ({
      id: `tool:${t.slug}`,
      type: "tool" as const,
      title: t.name,
      aliases: [],
      description: t.shortDescription,
      href: `/tools/${t.slug}`,
      slug: t.slug,
      tags: t.tags,
      category: t.category,
      subtitle: `${t.category.charAt(0).toUpperCase() + t.category.slice(1)} · ${t.platforms.join(", ")}`,
      relatedGameSlugs: t.relatedGameSlugs ?? [],
      relatedToolSlugs: t.relatedToolSlugs ?? [],
      relatedGuideSlugs: t.relatedGuideSlugs ?? [],
      badges: [t.status === "available" ? "Live" : t.status, ...t.platforms],
    }));
}

function buildAppDocuments(): SearchDocument[] {
  return searchAppsStore
    .filter((a) => a.status === "active" || a.status === "stable" || (a.status as string) === "published")
    .map((a) => {
      const latest = a.releases[0];
      return {
        id: `app:${a.slug}`,
        type: "app" as const,
        title: a.name,
        aliases: a.packageName ? [a.packageName] : [],
        description: a.excerpt,
        href: `/apps/${a.slug}`,
        slug: a.slug,
        tags: a.tags,
        category: a.category,
        subtitle: `${a.category} · v${latest?.version ?? "–"}`,
        relatedGameSlugs: a.relatedGames ?? [],
        relatedToolSlugs: a.relatedTools ?? [],
        relatedGuideSlugs: a.relatedGuides ?? [],
        badges: [
          latest?.verificationStatus === "verified" ? "Verified" : "",
          a.requiresRoot ? "Root Required" : "No Root",
        ].filter(Boolean),
      };
    });
}

function buildGuideDocuments(): SearchDocument[] {
  return searchGuidesStore
    .filter((g) => g.status === "published")
    .map((g) => ({
      id: `guide:${g.slug}`,
      type: "guide" as const,
      title: g.title,
      aliases: [],
      description: g.excerpt,
      href: `/guides/${g.slug}`,
      slug: g.slug,
      tags: g.tags,
      category: g.category,
      subtitle: `${g.category} · ${g.difficulty} · ${g.readingTimeMinutes} min`,
      relatedGameSlugs: g.gameIds ?? [],
      relatedToolSlugs: g.toolIds ?? [],
      relatedGuideSlugs: g.relatedGuideSlugs ?? [],
      badges: [g.contentType, g.difficulty],
    }));
}

/* ── Singleton index (built once, reused) ────────────────────── */

let _index: SearchDocument[] | null = null;

export function invalidateSearchIndex(): void {
  _index = null;
}

/**
 * Returns the complete normalized search document index.
 * Lazily built on first call and cached for module lifetime.
 *
 * Future: replace this with a remote index fetch from
 * Algolia/Typesense/Meilisearch/Supabase full-text search.
 */
export function getSearchIndex(): SearchDocument[] {
  if (_index) return _index;
  _index = [
    ...buildGameDocuments(),
    ...buildToolDocuments(),
    ...buildAppDocuments(),
    ...buildGuideDocuments(),
  ];
  return _index;
}

/** Total document count — useful for diagnostics */
export function getIndexSize(): number {
  return getSearchIndex().length;
}
