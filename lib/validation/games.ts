/**
 * lib/validation/games.ts
 * ────────────────────────────────────────────────────────────────
 * Validation schemas for Game queries, filters, and models.
 */

import { z } from "zod";
import { slugSchema, paginationSchema, contentStatusSchema } from "./common";

export const gameCategorySchema = z.enum([
  "battle-royale",
  "fps",
  "moba",
  "rpg",
  "strategy",
  "sports",
  "racing",
  "action",
  "other",
]);

export const platformSchema = z.enum(["android", "ios", "cross-platform"]);

export const performanceAreaSchema = z.enum([
  "fps",
  "frame-time",
  "touch-latency",
  "thermal",
  "network",
  "graphics",
  "battery",
  "stability",
  "memory",
]);

/** Query params for GET /api/games */
export const gameQuerySchema = paginationSchema.extend({
  q: z.string().max(100).optional(),
  category: z.union([gameCategorySchema, z.literal("all")]).optional().default("all"),
  platform: z.union([platformSchema, z.literal("all")]).optional().default("all"),
  performanceArea: z.union([performanceAreaSchema, z.literal("all")]).optional().default("all"),
  status: contentStatusSchema.optional().default("PUBLISHED"),
});

export type GameQueryParams = z.infer<typeof gameQuerySchema>;

/** Slug route param schema */
export const gameSlugParamSchema = z.object({
  slug: slugSchema,
});
