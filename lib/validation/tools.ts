/**
 * lib/validation/tools.ts
 * ────────────────────────────────────────────────────────────────
 * Validation schemas for Gaming Tools queries and definitions.
 */

import { z } from "zod";
import { slugSchema, contentStatusSchema } from "./common";

export const toolCategorySchema = z.enum([
  "performance",
  "network",
  "display",
  "device",
  "storage",
  "browser",
  "diagnostics",
  "gaming",
]);

export const toolPlatformSchema = z.enum(["web", "android", "windows"]);

/** Query params for GET /api/tools */
export const toolQuerySchema = z.object({
  q: z.string().max(100).optional(),
  category: z.union([toolCategorySchema, z.literal("all")]).optional().default("all"),
  platform: z.union([toolPlatformSchema, z.literal("all")]).optional().default("all"),
  status: contentStatusSchema.optional().default("PUBLISHED"),
});

export type ToolQueryParams = z.infer<typeof toolQuerySchema>;

/** Slug route param schema */
export const toolSlugParamSchema = z.object({
  slug: slugSchema,
});
