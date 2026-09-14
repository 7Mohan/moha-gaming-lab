/**
 * types/search.ts
 * ────────────────────────────────────────────────────────────────
 * Typed contracts for the Global Search & Discovery System.
 * Covers all four searchable sections: Games, Tools, Apps, Guides.
 */

export type SearchResultType = "game" | "tool" | "app" | "guide";

export interface SearchResultGame {
  type: "game";
  id: string;
  slug: string;
  title: string;
  subtitle: string;       // e.g. "Battle Royale · Android"
  excerpt: string;
  href: string;
  tags: string[];
  badges?: string[];      // e.g. ["HIGH", "Guide"]
  category?: string;
  relatedGameSlugs?: string[];
}

export interface SearchResultTool {
  type: "tool";
  id: string;
  slug: string;
  title: string;
  subtitle: string;       // e.g. "Performance · Web"
  excerpt: string;
  href: string;
  tags: string[];
  badges?: string[];      // e.g. ["Live", "browser"]
  category?: string;
  relatedGameSlugs?: string[];
}

export interface SearchResultApp {
  type: "app";
  id: string;
  slug: string;
  title: string;
  subtitle: string;       // e.g. "Gaming Tools · v2.1.0"
  excerpt: string;
  href: string;
  tags: string[];
  badges?: string[];      // e.g. ["Verified", "No Root"]
  category?: string;
  relatedGameSlugs?: string[];
}

export interface SearchResultGuide {
  type: "guide";
  id: string;
  slug: string;
  title: string;
  subtitle: string;       // e.g. "Performance · Intermediate · 8 min"
  excerpt: string;
  href: string;
  tags: string[];
  badges?: string[];      // e.g. ["Guide", "Advanced"]
  category?: string;
  relatedGameSlugs?: string[];
}

export type SearchResult =
  | SearchResultGame
  | SearchResultTool
  | SearchResultApp
  | SearchResultGuide;

export interface SearchResults {
  query: string;
  games: SearchResultGame[];
  tools: SearchResultTool[];
  apps: SearchResultApp[];
  guides: SearchResultGuide[];
  /** Flat ordered list of all results (for modal display) */
  all: SearchResult[];
  total: number;
  /** Suggested query when typos or close alternatives are detected */
  didYouMean?: string;
}

export type SearchSection = "all" | SearchResultType;

export type SearchSortOption = "relevance" | "alphabetical";

