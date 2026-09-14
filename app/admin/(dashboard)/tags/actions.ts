"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import { createTag, deleteTag, getTagBySlug } from "@/lib/services/tag-service";
import { getAllGames, updateGame } from "@/lib/services/game-service";
import { getAllApps, updateApp } from "@/lib/services/app-service";
import { getAllTools, updateTool } from "@/lib/services/tool-service";
import { getAllGuides, updateGuide } from "@/lib/services/guide-service";
import { invalidateSearchIndex } from "@/lib/search";

const tagSchema = z.object({
  name: z.string().min(2, "Tag name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters and hyphens only"),
});

export async function createTagAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("create");

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();

  const parsed = tagSchema.safeParse({ name, slug });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  try {
    const tag = await createTag(parsed.data);
    await recordAudit({
      userId: session.userId,
      action: "CREATE",
      entityType: "Tag",
      entityId: tag.id,
      entitySlug: tag.slug,
      metadata: { name: tag.name },
    });
    revalidatePath("/admin/tags");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function deleteTagAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("delete");
  try {
    await deleteTag(id);
    await recordAudit({
      userId: session.userId,
      action: "DELETE",
      entityType: "Tag",
      entityId: id,
    });
    revalidatePath("/admin/tags");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function mergeTagsAction(
  sourceSlug: string,
  destinationSlug: string
): Promise<{ success: boolean; error?: string; modifiedCount?: number }> {
  const session = await requirePermission("update");

  const src = sourceSlug?.trim().toLowerCase();
  const dest = destinationSlug?.trim().toLowerCase();

  if (!src || !dest) {
    return { success: false, error: "Both source and destination tag slugs are required." };
  }
  if (src === dest) {
    return { success: false, error: "Source and destination tags cannot be the same." };
  }

  try {
    let modifiedCount = 0;

    // Update Games
    const games = await getAllGames();
    for (const game of games) {
      if (game.tags && game.tags.includes(src)) {
        const newTags = Array.from(new Set(game.tags.map((t) => (t === src ? dest : t))));
        await updateGame(game.id, { tags: newTags });
        modifiedCount++;
      }
    }

    // Update Apps
    const apps = await getAllApps();
    for (const app of apps) {
      if (app.tags && app.tags.includes(src)) {
        const newTags = Array.from(new Set(app.tags.map((t) => (t === src ? dest : t))));
        await updateApp(app.id, { tags: newTags });
        modifiedCount++;
      }
    }

    // Update Tools
    const tools = await getAllTools();
    for (const tool of tools) {
      if (tool.tags && tool.tags.includes(src)) {
        const newTags = Array.from(new Set(tool.tags.map((t) => (t === src ? dest : t))));
        await updateTool(tool.id, { tags: newTags });
        modifiedCount++;
      }
    }

    // Update Guides
    const guides = await getAllGuides();
    for (const guide of guides) {
      if (guide.tags && guide.tags.includes(src)) {
        const newTags = Array.from(new Set(guide.tags.map((t) => (t === src ? dest : t))));
        await updateGuide(guide.id, { tags: newTags });
        modifiedCount++;
      }
    }

    // Delete source tag if exists
    const sourceTag = await getTagBySlug(src);
    if (sourceTag) {
      await deleteTag(sourceTag.id);
    }

    invalidateSearchIndex();

    await recordAudit({
      userId: session.userId,
      action: "MERGE",
      entityType: "Tag",
      entityId: sourceTag?.id || src,
      entitySlug: src,
      metadata: { sourceSlug: src, destinationSlug: dest, modifiedCount },
    });

    revalidatePath("/admin/tags");
    revalidatePath("/admin");
    return { success: true, modifiedCount };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}
