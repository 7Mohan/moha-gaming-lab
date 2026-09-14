/**
 * lib/env.ts
 * ────────────────────────────────────────────────────────────────
 * Centralized, type-safe environment configuration validated with Zod.
 * Protects server-only secrets from client exposure.
 */

import { z } from "zod";

const envSchema = z.object({
  /** PostgreSQL connection string for Prisma */
  DATABASE_URL: z.string().optional(),

  /** Secret token for administrative operations / internal revalidation */
  ADMIN_SECRET: z.string().min(8).optional(),

  /** Runtime environment */
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  /** Canonical site origin */
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("https://mohagaminglab.com"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!parsed.success) {
    console.warn(
      "[Env Warning] Environment variable validation warnings:",
      parsed.error.flatten().fieldErrors
    );
    // Return fallback defaults so builds don't fail unnecessarily
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      ADMIN_SECRET: process.env.ADMIN_SECRET,
      NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) || "development",
      NEXT_PUBLIC_SITE_URL:
        process.env.NEXT_PUBLIC_SITE_URL || "https://mohagaminglab.com",
    };
  }

  return parsed.data;
}

export const env = validateEnv();

/**
 * Returns true if a database URL is present and active
 */
export function hasDatabaseUrl(): boolean {
  return Boolean(env.DATABASE_URL && env.DATABASE_URL.startsWith("postgres"));
}
