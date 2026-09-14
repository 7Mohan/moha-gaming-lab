import type {
  Guide,
  GuideCategory,
  GuideContentType,
  GuideDifficulty,
  GuideSection,
} from "@/types/guide";

export const GUIDE_CATEGORIES: GuideCategory[] = [
  "Android Gaming",
  "Performance",
  "FPS & Frame Time",
  "Touch & Input",
  "Network",
  "Thermals",
  "Battery",
  "Graphics",
  "Troubleshooting",
  "Device Optimization",
  "Gaming Settings",
];

export const GUIDE_CONTENT_TYPES: GuideContentType[] = [
  "Guide",
  "Tutorial",
  "Troubleshooting",
  "Explainer",
  "Reference",
];

export const GUIDE_DIFFICULTIES: GuideDifficulty[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

export interface GuideFilters {
  query?: string;
  category?: string;
  difficulty?: string;
  contentType?: string;
  gameId?: string;
}

/**
 * Multi-token search and filtering engine for technical guides.
 */
export function filterGuides(guidesList: Guide[], filters: GuideFilters): Guide[] {
  let result = guidesList;

  // 1. Text Query Search
  if (filters.query && filters.query.trim().length > 0) {
    const tokens = filters.query.toLowerCase().trim().split(/\s+/);
    result = result.filter((guide) => {
      const searchable = [
        guide.title,
        guide.excerpt,
        guide.description,
        guide.category,
        guide.contentType,
        guide.difficulty,
        ...guide.tags,
        ...(guide.gameIds ?? []),
        ...(guide.toolIds ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return tokens.every((token) => searchable.includes(token));
    });
  }

  // 2. Category Filter
  if (filters.category && filters.category !== "all") {
    result = result.filter(
      (guide) => guide.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }

  // 3. Difficulty Filter
  if (filters.difficulty && filters.difficulty !== "all") {
    result = result.filter(
      (guide) => guide.difficulty.toLowerCase() === filters.difficulty!.toLowerCase()
    );
  }

  // 4. Content Type Filter
  if (filters.contentType && filters.contentType !== "all") {
    result = result.filter(
      (guide) => guide.contentType.toLowerCase() === filters.contentType!.toLowerCase()
    );
  }

  // 5. Game Filter
  if (filters.gameId && filters.gameId !== "all") {
    result = result.filter(
      (guide) => guide.gameIds && guide.gameIds.includes(filters.gameId!)
    );
  }

  return result;
}

export interface TocItem {
  id: string;
  title: string;
  level: "h2" | "h3";
}

/**
 * Recursively extracts flat Table of Contents items from guide sections.
 */
export function extractTableOfContents(sections: GuideSection[]): TocItem[] {
  const items: TocItem[] = [];

  function traverse(secList: GuideSection[]) {
    for (const sec of secList) {
      items.push({
        id: sec.id,
        title: sec.title,
        level: sec.level,
      });

      if (sec.subSections && sec.subSections.length > 0) {
        traverse(sec.subSections);
      }
    }
  }

  traverse(sections);
  return items;
}
