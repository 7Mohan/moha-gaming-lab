/**
 * lib/validation/common.ts
 * ────────────────────────────────────────────────────────────────
 * Core reusable Zod validation primitives across all domains.
 */

import { z } from "zod";

/**
 * Validates slug format: lowercase alphanumeric, numbers, and single hyphens.
 * Prevents path traversal, URL encoding issues, and special character injection.
 */
export const slugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(120, "Slug cannot exceed 120 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must be lowercase alphanumeric characters separated by single hyphens",
  });

/**
 * Validates URLs: enforces http/https protocol, rejects dangerous schemes
 * like javascript:, data:, file:, or vbscript:.
 */
export const urlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "URL must use https:// or http:// protocol" }
  );

/**
 * Safe external or relative URL
 */
export const safeHrefSchema = z.string().refine(
  (val) => {
    if (val.startsWith("/")) return true; // Relative path
    try {
      const parsed = new URL(val);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  },
  { message: "Path must be a relative link (/path) or a valid HTTP(S) URL" }
);

/**
 * Standard pagination query parameters with server-enforced boundaries.
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Content publishing status enum schema.
 */
export const contentStatusSchema = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);
export type ContentStatus = z.infer<typeof contentStatusSchema>;

/**
 * Security and integrity verification status.
 */
export const verificationStatusSchema = z.enum([
  "VERIFIED",
  "UNVERIFIED",
  "PENDING",
  "UNAVAILABLE",
]);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

/**
 * Download source type classification.
 */
export const downloadSourceTypeSchema = z.enum([
  "OFFICIAL_DEVELOPER",
  "GITHUB_RELEASE",
  "DIRECT_HOSTED",
  "FDROID",
  "UNVERIFIED",
  "UNAVAILABLE",
]);
export type DownloadSourceType = z.infer<typeof downloadSourceTypeSchema>;

/**
 * Cryptographic checksum validation (SHA-256: 64 hex chars, MD5: 32 hex chars).
 */
export const sha256Schema = z
  .string()
  .regex(/^[a-fA-F0-9]{64}$/, "Must be a valid 64-character hex SHA-256 hash");

export const md5Schema = z
  .string()
  .regex(/^[a-fA-F0-9]{32}$/, "Must be a valid 32-character hex MD5 hash");

/**
 * Standard API Response envelope shape
 */
export interface ApiResponseEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
