/**
 * lib/validation/guides.ts
 * ────────────────────────────────────────────────────────────────
 * Validation schemas for Technical Guides queries and models.
 */

import { z } from "zod";
import { slugSchema, paginationSchema, contentStatusSchema } from "./common";

export const guideCategorySchema = z.enum([
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
]);

export const guideContentTypeSchema = z.enum([
  "Guide",
  "Tutorial",
  "Troubleshooting",
  "Explainer",
  "Reference",
]);

export const guideDifficultySchema = z.enum(["Beginner", "Intermediate", "Advanced"]);

/** Query params for GET /api/guides */
export const guideQuerySchema = paginationSchema.extend({
  q: z.string().max(100).optional(),
  category: z.union([guideCategorySchema, z.literal("all")]).optional().default("all"),
  difficulty: z.union([guideDifficultySchema, z.literal("all")]).optional().default("all"),
  contentType: z.union([guideContentTypeSchema, z.literal("all")]).optional().default("all"),
  tag: z.string().max(50).optional(),
  status: contentStatusSchema.optional().default("PUBLISHED"),
});

export type GuideQueryParams = z.infer<typeof guideQuerySchema>;

/** Slug route param schema */
export const guideSlugParamSchema = z.object({
  slug: slugSchema,
});
