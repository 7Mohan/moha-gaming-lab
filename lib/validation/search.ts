/**
 * lib/validation/search.ts
 * ────────────────────────────────────────────────────────────────
 * Validation schemas for Global Search API requests.
 */

import { z } from "zod";

export const searchSectionSchema = z.enum(["all", "game", "tool", "app", "guide"]);

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query cannot be empty").max(120, "Query too long"),
  section: searchSectionSchema.default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(8),
  sort: z.enum(["relevance", "alphabetical"]).default("relevance"),
  game: z.string().max(60).optional(),
});

export type ValidatedSearchQuery = z.infer<typeof searchQuerySchema>;
