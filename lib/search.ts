/**
 * lib/search.ts
 * ────────────────────────────────────────────────────────────────
 * Unified cross-section search engine for Moha Gaming Lab.
 *
 * Searches across:  Games · Tools · Apps · Guides
 *
 * Features:
 *  - 100% in-memory, zero network requests, instant results
 *  - Token-based fuzzy matching + Levenshtein typo-tolerance
 *  - Intelligent "Did you mean?" suggestions
 *  - Cross-section relational linking (relatedGameSlugs, category)
 *  - Weighted relevance scoring
 *  - Clean typed output for both modal and full search page
 */

import type {
  SearchResult,
  SearchResultGame,
  SearchResultTool,
  SearchResultApp,
  SearchResultGuide,
  SearchResults,
} from "@/types/search";

export {
  getSearchIndex,
  getIndexSize,
  invalidateSearchIndex,
  registerGameForSearch,
  registerToolForSearch,
  registerAppForSearch,
  registerGuideForSearch,
  getSearchStore,
} from "@/lib/search-index";
import { getSearchStore } from "@/lib/search-index";

/* ── Levenshtein Distance for Typo-Tolerance ───────────────── */

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single row memory optimization
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const prevJ = prev[j] ?? 0;
      const prevJM1 = prev[j - 1] ?? 0;
      const currJM1 = curr[j - 1] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prevJ + 1,        // deletion
        currJM1 + 1,      // insertion
        prevJM1 + cost    // substitution
      );
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }

  return prev[n] ?? 0;
}

/* ── Text normalisation ─────────────────────────────────────── */

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score a document against query tokens.
 * Supports exact substring matches and fuzzy Levenshtein matches.
 * Returns 0 if ANY token cannot be matched even fuzzily.
 */
function score(
  tokens: string[],
  fields: { text: string; weight: number }[]
): number {
  if (tokens.length === 0) return 1;

  let totalScore = 0;

  for (const token of tokens) {
    let tokenMatched = false;
    let bestTokenScore = 0;

    for (const { text, weight } of fields) {
      if (!text) continue;
      const normalised = norm(text);

      // 1. Exact substring match (highest score)
      if (normalised.includes(token)) {
        bestTokenScore = Math.max(bestTokenScore, weight);
        tokenMatched = true;
        continue;
      }

      // 2. Fuzzy match word-by-word if token length >= 3
      if (token.length >= 3 && !tokenMatched) {
        const words = normalised.split(" ");
        const maxDist = token.length <= 4 ? 1 : token.length <= 7 ? 2 : 3;

        for (const word of words) {
          if (Math.abs(word.length - token.length) > maxDist) continue;
          const dist = levenshtein(token, word);
          if (dist <= maxDist) {
            // Partial score based on edit distance
            const fuzzyWeight = weight * (1 - dist * 0.25);
            bestTokenScore = Math.max(bestTokenScore, fuzzyWeight);
            tokenMatched = true;
            break;
          }
        }
      }
    }

    if (!tokenMatched) return 0; // All tokens must match somewhere
    totalScore += bestTokenScore;
  }

  return totalScore;
}

/* ── Section-level search functions ─────────────────────────── */

function searchGames(tokens: string[], includeDrafts = false): SearchResultGame[] {
  const results: { item: SearchResultGame; score: number }[] = [];

  for (const g of getSearchStore().games) {
    if (!includeDrafts && g.status !== "active" && g.status !== ("published" as string)) {
      continue;
    }
    const s = score(tokens, [
      { text: g.name, weight: 10 },
      { text: g.excerpt, weight: 5 },
      { text: g.description ?? "", weight: 3 },
      { text: g.category, weight: 4 },
      { text: g.platform, weight: 2 },
      ...g.tags.map((t) => ({ text: t, weight: 2 })),
      ...(g.altNames ?? []).map((a) => ({ text: a, weight: 6 })),
      ...g.performanceAreas.map((a) => ({ text: a, weight: 3 })),
    ]);

    if (s === 0) continue;

    results.push({
      score: s,
      item: {
        type: "game",
        id: g.slug,
        slug: g.slug,
        title: g.name,
        subtitle: `${g.category.replace(/-/g, " ")} · ${
          g.platform === "android"
            ? "Android"
            : g.platform === "ios"
            ? "iOS"
            : "Cross-platform"
        }`,
        excerpt: g.excerpt,
        href: `/games/${g.slug}`,
        tags: g.tags.slice(0, 3),
        badges: [
          g.deviceTier.toUpperCase(),
          ...(g.guideSlug ? ["Guide"] : []),
        ],
        category: g.category,
        relatedGameSlugs: [g.slug],
      },
    });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

function searchTools(tokens: string[], includeDrafts = false): SearchResultTool[] {
  const results: { item: SearchResultTool; score: number }[] = [];

  for (const t of getSearchStore().tools) {
    if (!includeDrafts && t.status !== "available" && t.status !== "beta") {
      continue;
    }
    const s = score(tokens, [
      { text: t.name, weight: 10 },
      { text: t.shortDescription, weight: 6 },
      { text: t.description, weight: 3 },
      { text: t.whatItDoes, weight: 4 },
      { text: t.category, weight: 4 },
      ...t.whatItMeasures.map((m) => ({ text: m, weight: 3 })),
      ...t.tags.map((tg) => ({ text: tg, weight: 2 })),
      ...t.platforms.map((p) => ({ text: p, weight: 2 })),
    ]);

    if (s === 0) continue;

    results.push({
      score: s,
      item: {
        type: "tool",
        id: t.slug,
        slug: t.slug,
        title: t.name,
        subtitle: `${t.category.charAt(0).toUpperCase() + t.category.slice(1)} · ${t.platforms.join(", ")}`,
        excerpt: t.shortDescription,
        href: `/tools/${t.slug}`,
        tags: t.tags.slice(0, 3),
        badges: [
          t.status === "available" ? "Live" : t.status,
          ...t.platforms,
        ],
        category: t.category,
        relatedGameSlugs: t.relatedGameSlugs ?? [],
      },
    });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

function searchApps(tokens: string[], includeDrafts = false): SearchResultApp[] {
  const results: { item: SearchResultApp; score: number }[] = [];

  for (const a of getSearchStore().apps) {
    if (!includeDrafts && a.status !== "active" && a.status !== "stable" && a.status !== ("published" as string)) {
      continue;
    }
    const latestRelease = a.releases[0];
    const s = score(tokens, [
      { text: a.name, weight: 10 },
      { text: a.excerpt, weight: 6 },
      { text: a.description, weight: 3 },
      { text: a.developer, weight: 4 },
      { text: a.category, weight: 4 },
      { text: a.packageName ?? "", weight: 5 },
      ...a.tags.map((t) => ({ text: t, weight: 2 })),
      ...a.features.map((f) => ({ text: f, weight: 2 })),
    ]);

    if (s === 0) continue;

    results.push({
      score: s,
      item: {
        type: "app",
        id: a.slug,
        slug: a.slug,
        title: a.name,
        subtitle: `${a.category} · v${latestRelease?.version ?? "–"}`,
        excerpt: a.excerpt,
        href: `/apps/${a.slug}`,
        tags: a.tags.slice(0, 3),
        badges: [
          latestRelease?.verificationStatus === "verified" ? "Verified" : "",
          a.requiresRoot ? "Root Required" : "No Root",
        ].filter(Boolean),
        category: a.category,
        relatedGameSlugs: a.relatedGames ?? [],
      },
    });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

function searchGuides(tokens: string[], includeDrafts = false): SearchResultGuide[] {
  const results: { item: SearchResultGuide; score: number }[] = [];

  for (const g of getSearchStore().guides) {
    if (!includeDrafts && g.status !== "published") {
      continue;
    }
    const s = score(tokens, [
      { text: g.title, weight: 10 },
      { text: g.excerpt, weight: 6 },
      { text: g.description, weight: 3 },
      { text: g.category, weight: 4 },
      { text: g.contentType, weight: 3 },
      { text: g.difficulty, weight: 2 },
      ...g.tags.map((t) => ({ text: t, weight: 2 })),
      ...(g.gameIds ?? []).map((id) => ({ text: id, weight: 3 })),
      ...(g.toolIds ?? []).map((id) => ({ text: id, weight: 3 })),
    ]);

    if (s === 0) continue;

    results.push({
      score: s,
      item: {
        type: "guide",
        id: g.slug,
        slug: g.slug,
        title: g.title,
        subtitle: `${g.category} · ${g.difficulty} · ${g.readingTimeMinutes} min`,
        excerpt: g.excerpt,
        href: `/guides/${g.slug}`,
        tags: g.tags.slice(0, 3),
        badges: [g.contentType, g.difficulty],
        category: g.category,
        relatedGameSlugs: g.gameIds ?? [],
      },
    });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

/* ── "Did You Mean?" Dictionary & Detection ────────────────── */

const CANONICAL_TERMS: string[] = [
  "PUBG Mobile",
  "Call of Duty Mobile",
  "Genshin Impact",
  "Free Fire",
  "CarX Street",
  "eFootball",
  "Refresh Rate Test",
  "Gamepad Tester",
  "Network Latency Test",
  "Device Capabilities",
  "Frame Rate Benchmark",
  "Touch Latency Test",
  "Audio Latency Test",
  "Battery Drain Simulator",
  "Resolution Scale Calculator",
  "Thermal Throttling Simulator",
  "Shizuku",
  "FPS Monitor Toolkit",
  "Scene Android",
  "Kernel Auditor",
  "Breezy Weather",
  "Termux",
  "Brevent",
  "Thermal Throttling Guide",
  "Understanding Frame Time",
  "Diagnose FPS Drops",
  "Touch Sampling Rate",
  "Audio Latency Android",
  "Display Refresh Rate 120Hz",
  "fps drops",
  "refresh rate",
  "gamepad test",
  "network ping",
  "thermal throttling",
  "touch latency",
  "frame time",
  "120Hz gaming",
  "battery drain",
];

function findDidYouMean(rawQuery: string, totalResults: number): string | undefined {
  const qNorm = norm(rawQuery);
  if (qNorm.length < 3) return undefined;

  // Don't suggest if query is an exact match for one of our canonical terms
  if (CANONICAL_TERMS.some((term) => norm(term) === qNorm)) {
    return undefined;
  }

  let bestTerm: string | undefined;
  let minDistance = Infinity;

  for (const term of CANONICAL_TERMS) {
    const tNorm = norm(term);

    // If already identical or starts with, skip
    if (tNorm === qNorm) continue;

    // Check whole string distance
    const dist = levenshtein(qNorm, tNorm);
    const maxAllowed = Math.min(3, Math.max(1, Math.floor(qNorm.length * 0.35)));

    if (dist <= maxAllowed && dist < minDistance) {
      minDistance = dist;
      bestTerm = term;
    }

    // Check token-level distance for first token
    const tokensQ = qNorm.split(" ");
    const tokensT = tNorm.split(" ");
    const firstQ = tokensQ[0] ?? "";
    const firstT = tokensT[0] ?? "";
    if (firstQ.length >= 4 && firstT.length >= 4) {
      const tokenDist = levenshtein(firstQ, firstT);
      if (tokenDist <= 1 && tokenDist < minDistance) {
        minDistance = tokenDist;
        bestTerm = term;
      }
    }
  }

  // Only return if results are low/zero or distance is minimal
  if (bestTerm && (totalResults <= 1 || minDistance <= 2)) {
    return bestTerm;
  }

  return undefined;
}

/* ── Main unified search API ────────────────────────────────── */

export interface GlobalSearchOptions {
  limit?: number;
  includeDrafts?: boolean;
}

/**
 * Global search across all Moha Gaming Lab content sections.
 *
 * @param rawQuery       - User input string
 * @param limitOrOptions - Max results per section or options object
 */
export function globalSearch(
  rawQuery: string,
  limitOrOptions: number | GlobalSearchOptions = 8
): SearchResults {
  const limit = typeof limitOrOptions === "number" ? limitOrOptions : (limitOrOptions.limit ?? 8);
  const includeDrafts = typeof limitOrOptions === "object" ? !!limitOrOptions.includeDrafts : false;

  const query = rawQuery.trim();
  const tokens = norm(query).split(" ").filter(Boolean);

  if (tokens.length === 0) {
    return {
      query,
      games: [],
      tools: [],
      apps: [],
      guides: [],
      all: [],
      total: 0,
    };
  }

  const games = searchGames(tokens, includeDrafts).slice(0, limit);
  const tools = searchTools(tokens, includeDrafts).slice(0, limit);
  const apps = searchApps(tokens, includeDrafts).slice(0, limit);
  const guides = searchGuides(tokens, includeDrafts).slice(0, limit);

  // Interleave for unified `all` list (round-robin for diversity)
  const all: SearchResult[] = [];
  const maxLen = Math.max(games.length, tools.length, apps.length, guides.length);
  for (let i = 0; i < maxLen; i++) {
    const g = games[i];
    const t = tools[i];
    const a = apps[i];
    const gu = guides[i];
    if (g) all.push(g);
    if (t) all.push(t);
    if (a) all.push(a);
    if (gu) all.push(gu);
  }

  const total = games.length + tools.length + apps.length + guides.length;
  const didYouMean = findDidYouMean(query, total);

  return {
    query,
    games,
    tools,
    apps,
    guides,
    all,
    total,
    didYouMean,
  };
}

/* ── Section icon paths (for UI) ───────────────────────────── */

export const SECTION_LABELS: Record<string, string> = {
  all: "All Results",
  game: "Games",
  tool: "Tools",
  app: "Apps",
  guide: "Guides",
};

export const SECTION_COLORS: Record<string, string> = {
  game: "#00E5A0",
  tool: "#60A5FA",
  app: "#A78BFA",
  guide: "#F59E0B",
};

export const SECTION_ICONS: Record<string, string> = {
  game: "Gamepad2",
  tool: "Wrench",
  app: "Smartphone",
  guide: "BookOpen",
};

/* ── Query suggestions (static seed for empty state) ─────── */

export const SUGGESTED_QUERIES: string[] = [
  "PUBG Mobile FPS",
  "network latency",
  "refresh rate test",
  "thermal throttling",
  "Shizuku",
  "frame time",
  "120Hz",
  "gamepad",
  "ping",
  "touch latency",
  "GPU test",
  "FPS drops",
];
