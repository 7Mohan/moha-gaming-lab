"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import {
  createGame,
  updateGame,
  deleteGame,
  setGameStatus,
  getGameById,
  getGameBySlug,
} from "@/lib/services/game-service";
import { invalidateSearchIndex } from "@/lib/search-index";
import type { Game, GameCategory, PerformanceArea, Platform } from "@/types/game";

const gameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(2, "Category is required"),
  platform: z.enum(["android", "cross-platform", "pc", "ios"]),
  deviceTier: z.enum(["low", "mid", "high"]),
  status: z.enum(["active", "draft", "coming-soon", "archived"]),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  performanceAreas: z.array(z.string()).default([]),
  optimizationRecs: z.array(z.string()).default([]),
  commonProblems: z.array(z.string()).default([]),
  iconUrl: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  altText: z.string().optional().nullable(),
  relatedToolSlugs: z.array(z.string()).default([]),
  relatedAppSlugs: z.array(z.string()).default([]),
  relatedGuideSlugs: z.array(z.string()).default([]),
});

export type GameActionResult =
  | { success: true; gameId: string; slug: string }
  | { success: false; error: string; fields?: Record<string, string[]> };

export async function createGameAction(
  prevState: GameActionResult | null,
  formData: FormData
): Promise<GameActionResult> {
  const session = await requirePermission("create");

  const rawTags = (formData.get("tags") as string) || "";
  const rawPerf = (formData.get("performanceAreas") as string) || "";
  const rawRecs = (formData.get("optimizationRecs") as string) || "";
  const rawProbs = (formData.get("commonProblems") as string) || "";
  const rawTools = (formData.get("relatedToolSlugs") as string) || "";
  const rawApps = (formData.get("relatedAppSlugs") as string) || "";
  const rawGuides = (formData.get("relatedGuideSlugs") as string) || "";

  const payload = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    excerpt: (formData.get("excerpt") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    category: (formData.get("category") as string)?.trim(),
    platform: (formData.get("platform") as string)?.trim(),
    deviceTier: (formData.get("deviceTier") as string)?.trim(),
    status: (formData.get("status") as string)?.trim(),
    featured: formData.get("featured") === "true" || formData.get("featured") === "on",
    tags: rawTags.split(",").map((t) => t.trim()).filter(Boolean),
    performanceAreas: rawPerf.split(",").map((t) => t.trim()).filter(Boolean),
    optimizationRecs: rawRecs.split("\n").map((t) => t.trim()).filter(Boolean),
    commonProblems: rawProbs.split("\n").map((t) => t.trim()).filter(Boolean),
    iconUrl: (formData.get("iconUrl") as string)?.trim() || null,
    coverImage: (formData.get("coverImage") as string)?.trim() || null,
    altText: (formData.get("altText") as string)?.trim() || null,
    relatedToolSlugs: rawTools.split(",").map((s) => s.trim()).filter(Boolean),
    relatedAppSlugs: rawApps.split(",").map((s) => s.trim()).filter(Boolean),
    relatedGuideSlugs: rawGuides.split(",").map((s) => s.trim()).filter(Boolean),
  };

  const parsed = gameSchema.safeParse(payload);
  if (!parsed.success) {
    const errorMap: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!errorMap[field]) errorMap[field] = [];
      errorMap[field]!.push(issue.message);
    });
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed", fields: errorMap };
  }

  // Check unique slug
  const existing = await getGameBySlug(parsed.data.slug);
  if (existing) {
    return { success: false, error: "A game with this slug already exists. Please choose a unique slug." };
  }

  const id = `game-${parsed.data.slug}`;
  const mappedRecs = parsed.data.optimizationRecs.map((rec, i) => ({
    id: `rec-${i + 1}`,
    category: "performance" as const,
    title: rec,
    description: rec,
    difficulty: "easy" as const,
    risk: "low" as const,
  }));
  const mappedProblems = parsed.data.commonProblems.map((prob, i) => ({
    id: `prob-${i + 1}`,
    title: prob,
    what: prob,
    causes: ["Hardware resource saturation"],
    steps: ["Adjust graphical settings or apply device cooling"],
  }));

  const newGame: Game = {
    id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt,
    description: parsed.data.description,
    category: parsed.data.category as GameCategory,
    platform: parsed.data.platform as Platform,
    deviceTier: parsed.data.deviceTier as Game["deviceTier"],
    status: parsed.data.status === "active" ? "active" : "draft",
    featured: parsed.data.featured,
    tags: parsed.data.tags,
    performanceAreas: parsed.data.performanceAreas as PerformanceArea[],
    optimizationRecs: mappedRecs,
    commonProblems: mappedProblems,
    iconUrl: parsed.data.iconUrl || null,
    coverImage: parsed.data.coverImage || null,
    relatedToolSlugs: parsed.data.relatedToolSlugs,
    relatedAppSlugs: parsed.data.relatedAppSlugs,
    relatedGuideSlugs: parsed.data.relatedGuideSlugs,
  };

  await createGame(newGame);

  await recordAudit({
    userId: session.userId,
    action: "CREATE",
    entityType: "Game",
    entityId: id,
    entitySlug: newGame.slug,
    metadata: { name: newGame.name, status: newGame.status },
  });

  invalidateSearchIndex();
  revalidatePath("/games");
  revalidatePath("/admin/games");
  revalidatePath("/admin");

  return { success: true, gameId: id, slug: newGame.slug };
}

export async function updateGameAction(
  id: string,
  prevState: GameActionResult | null,
  formData: FormData
): Promise<GameActionResult> {
  const session = await requirePermission("update");

  // Concurrency detection (Flow 25)
  const expectedUpdatedAt = formData.get("expectedUpdatedAt") as string | null;
  if (expectedUpdatedAt) {
    const existingGame = await getGameById(id);
    if (
      existingGame?.updatedAt &&
      new Date(existingGame.updatedAt).getTime() > new Date(expectedUpdatedAt).getTime() + 1000
    ) {
      return {
        success: false,
        error: "This content was updated by someone else. Review the latest version before saving your changes.",
      };
    }
  }

  const rawTags = (formData.get("tags") as string) || "";
  const rawPerf = (formData.get("performanceAreas") as string) || "";
  const rawRecs = (formData.get("optimizationRecs") as string) || "";
  const rawProbs = (formData.get("commonProblems") as string) || "";
  const rawTools = (formData.get("relatedToolSlugs") as string) || "";
  const rawApps = (formData.get("relatedAppSlugs") as string) || "";
  const rawGuides = (formData.get("relatedGuideSlugs") as string) || "";

  const payload = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    excerpt: (formData.get("excerpt") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    category: (formData.get("category") as string)?.trim(),
    platform: (formData.get("platform") as string)?.trim(),
    deviceTier: (formData.get("deviceTier") as string)?.trim(),
    status: (formData.get("status") as string)?.trim(),
    featured: formData.get("featured") === "true" || formData.get("featured") === "on",
    tags: rawTags.split(",").map((t) => t.trim()).filter(Boolean),
    performanceAreas: rawPerf.split(",").map((t) => t.trim()).filter(Boolean),
    optimizationRecs: rawRecs.split("\n").map((t) => t.trim()).filter(Boolean),
    commonProblems: rawProbs.split("\n").map((t) => t.trim()).filter(Boolean),
    iconUrl: (formData.get("iconUrl") as string)?.trim() || null,
    coverImage: (formData.get("coverImage") as string)?.trim() || null,
    altText: (formData.get("altText") as string)?.trim() || null,
    relatedToolSlugs: rawTools.split(",").map((s) => s.trim()).filter(Boolean),
    relatedAppSlugs: rawApps.split(",").map((s) => s.trim()).filter(Boolean),
    relatedGuideSlugs: rawGuides.split(",").map((s) => s.trim()).filter(Boolean),
  };

  const parsed = gameSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const mappedRecs = parsed.data.optimizationRecs.map((rec, i) => ({
    id: `rec-${i + 1}`,
    category: "performance" as const,
    title: rec,
    description: rec,
    difficulty: "easy" as const,
    risk: "low" as const,
  }));
  const mappedProblems = parsed.data.commonProblems.map((prob, i) => ({
    id: `prob-${i + 1}`,
    title: prob,
    what: prob,
    causes: ["Hardware resource saturation"],
    steps: ["Adjust graphical settings or apply device cooling"],
  }));

  const updated = await updateGame(id, {
    name: parsed.data.name,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt,
    description: parsed.data.description,
    category: parsed.data.category as GameCategory,
    platform: parsed.data.platform as Platform,
    deviceTier: parsed.data.deviceTier as Game["deviceTier"],
    status: parsed.data.status === "active" ? "active" : "draft",
    featured: parsed.data.featured,
    tags: parsed.data.tags,
    performanceAreas: parsed.data.performanceAreas as PerformanceArea[],
    optimizationRecs: mappedRecs,
    commonProblems: mappedProblems,
    iconUrl: parsed.data.iconUrl || null,
    coverImage: parsed.data.coverImage || null,
    relatedToolSlugs: parsed.data.relatedToolSlugs,
    relatedAppSlugs: parsed.data.relatedAppSlugs,
    relatedGuideSlugs: parsed.data.relatedGuideSlugs,
  });

  await recordAudit({
    userId: session.userId,
    action: "UPDATE",
    entityType: "Game",
    entityId: id,
    entitySlug: updated.slug,
    metadata: { name: updated.name, status: updated.status },
  });

  invalidateSearchIndex();
  revalidatePath("/games");
  revalidatePath(`/games/${updated.slug}`);
  revalidatePath("/admin/games");
  revalidatePath("/admin");

  return { success: true, gameId: id, slug: updated.slug };
}

export async function archiveGameAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("archive");
  try {
    const game = await getGameById(id);
    await setGameStatus(id, "archived");
    await recordAudit({
      userId: session.userId,
      action: "ARCHIVE",
      entityType: "Game",
      entityId: id,
      entitySlug: game?.slug,
    });
    invalidateSearchIndex();
    revalidatePath("/games");
    revalidatePath("/admin/games");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function publishGameAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("publish");
  try {
    const game = await getGameById(id);
    await setGameStatus(id, "active");
    await recordAudit({
      userId: session.userId,
      action: "PUBLISH",
      entityType: "Game",
      entityId: id,
      entitySlug: game?.slug,
    });
    invalidateSearchIndex();
    revalidatePath("/games");
    if (game?.slug) {
      revalidatePath(`/games/${game.slug}`);
    }
    revalidatePath("/admin/games");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function deleteGameAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("delete");
  try {
    const game = await getGameById(id);
    await deleteGame(id);
    await recordAudit({
      userId: session.userId,
      action: "DELETE",
      entityType: "Game",
      entityId: id,
      entitySlug: game?.slug,
    });
    revalidatePath("/games");
    revalidatePath("/admin/games");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function bulkArchiveGamesAction(ids: string[]): Promise<{ success: boolean }> {
  await requirePermission("archive");
  for (const id of ids) {
    await setGameStatus(id, "archived");
  }
  revalidatePath("/games");
  revalidatePath("/admin/games");
  return { success: true };
}
