/**
 * lib/validation/apps.ts
 * ────────────────────────────────────────────────────────────────
 * Validation schemas for Android App and Release queries and models.
 */

import { z } from "zod";
import {
  slugSchema,
  paginationSchema,
  contentStatusSchema,
  verificationStatusSchema,
  downloadSourceTypeSchema,
  urlSchema,
  sha256Schema,
  md5Schema,
} from "./common";

export const appCategorySchema = z.enum([
  "Gaming Tools",
  "Performance",
  "Diagnostics",
  "Network",
  "Customization",
  "Game Utilities",
  "Device Utilities",
  "Development",
]);

export const appArchitectureSchema = z.enum([
  "arm64-v8a",
  "armeabi-v7a",
  "x86_64",
  "universal",
]);

/** Schema for validating Android App Releases */
export const appReleaseSchema = z.object({
  version: z.string().min(1).max(30),
  versionCode: z.number().int().positive().optional(),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  androidMinVersion: z.string().min(1).max(10).default("8.0"),
  targetSdkVersion: z.number().int().min(21).max(36).optional(),
  architectures: z.array(appArchitectureSchema).min(1),
  fileSize: z.number().int().positive().optional(),
  downloadUrl: urlSchema.optional(),
  sourceUrl: urlSchema.optional(),
  sourceName: z.string().min(1).max(100),
  sourceType: downloadSourceTypeSchema,
  checksumSha256: sha256Schema.optional(),
  checksumMd5: md5Schema.optional(),
  verificationStatus: verificationStatusSchema,
  verificationEvidence: z.string().max(1000).optional(),
  changelog: z.array(z.string().max(300)).default([]),
});

export type ValidatedAppRelease = z.infer<typeof appReleaseSchema>;

/** Query params for GET /api/apps */
export const appQuerySchema = paginationSchema.extend({
  q: z.string().max(100).optional(),
  category: z.union([appCategorySchema, z.literal("all")]).optional().default("all"),
  root: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  verificationStatus: verificationStatusSchema.optional(),
  status: contentStatusSchema.optional().default("PUBLISHED"),
});

export type AppQueryParams = z.infer<typeof appQuerySchema>;

/** Slug route param schema */
export const appSlugParamSchema = z.object({
  slug: slugSchema,
});
