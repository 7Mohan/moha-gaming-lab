/**
 * lib/seo/redirects.ts
 * ────────────────────────────────────────────────────────────────
 * Production 301/302 Redirect Engine for Moha Gaming Lab.
 * Handles slug changes, URL migrations, open-redirect defense,
 * and redirect loop prevention.
 */

import { hasDatabaseUrl } from "@/lib/env";

export interface RedirectRule {
  id: string;
  sourcePath: string;
  targetPath: string;
  statusCode: number;
  enabled: boolean;
  hitCount: number;
  lastHitAt?: Date | null;
  description?: string | null;
}

/**
 * Normalizes a URL path for redirect matching.
 */
export function normalizeRedirectPath(path: string): string {
  if (!path) return "/";
  let clean = path.toLowerCase().trim();
  if (!clean.startsWith("/")) clean = "/" + clean;
  if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
  return clean;
}

/**
 * Searches for an active redirect rule matching the given path.
 */
export async function matchRedirect(rawPath: string): Promise<{ targetPath: string; statusCode: number } | null> {
  if (!hasDatabaseUrl()) return null;

  const normalized = normalizeRedirectPath(rawPath);

  try {
    const { prisma } = await import("@/lib/db/prisma");
    const rule = await prisma.redirect.findUnique({
      where: { sourcePath: normalized },
    });

    if (rule && rule.enabled) {
      // Async update hit counter without blocking response
      prisma.redirect
        .update({
          where: { id: rule.id },
          data: {
            hitCount: { increment: 1 },
            lastHitAt: new Date(),
          },
        })
        .catch(() => {});

      return {
        targetPath: rule.targetPath,
        statusCode: rule.statusCode === 302 ? 302 : 301,
      };
    }
  } catch {
    // Return null on database errors
  }

  return null;
}

/**
 * Validates and creates a redirect rule safely.
 * Throws on self-redirects, invalid targets, or redirect loops.
 */
export async function createRedirectRule(params: {
  sourcePath: string;
  targetPath: string;
  statusCode?: number;
  description?: string;
}): Promise<{ success: boolean; error?: string; rule?: RedirectRule }> {
  if (!hasDatabaseUrl()) {
    return { success: false, error: "Database connection unavailable." };
  }

  const source = normalizeRedirectPath(params.sourcePath);
  const target = normalizeRedirectPath(params.targetPath);
  const statusCode = params.statusCode === 302 ? 302 : 301;

  // 1. Prevent self-redirect loop
  if (source === target) {
    return { success: false, error: "Source and target path cannot be identical (self-redirect loop)." };
  }

  // 2. Open redirect prevention (must be relative path starting with /)
  if (!target.startsWith("/")) {
    return { success: false, error: "Target URL must be an internal relative path starting with '/'." };
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");

    // 3. Prevent 2-hop immediate loop (B -> A)
    const reverse = await prisma.redirect.findUnique({
      where: { sourcePath: target },
    });
    if (reverse && reverse.targetPath === source) {
      return { success: false, error: `Loop detected: Target ${target} already redirects back to ${source}.` };
    }

    const created = await prisma.redirect.create({
      data: {
        sourcePath: source,
        targetPath: target,
        statusCode,
        description: params.description?.slice(0, 255) || null,
      },
    });

    return {
      success: true,
      rule: {
        ...created,
        lastHitAt: created.lastHitAt,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create redirect.";
    if (msg.includes("Unique constraint")) {
      return { success: false, error: "A redirect rule for this source path already exists." };
    }
    return { success: false, error: msg };
  }
}

/**
 * Lists all redirect rules for the admin panel.
 */
export async function listRedirectRules(): Promise<RedirectRule[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const { prisma } = await import("@/lib/db/prisma");
    const rules = await prisma.redirect.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rules;
  } catch {
    return [];
  }
}
