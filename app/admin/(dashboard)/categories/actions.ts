"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import {
  createCategory,
  deleteCategory,
  getCategories,
} from "@/lib/services/category-service";
import { getAllGames } from "@/lib/services/game-service";
import { getAllApps } from "@/lib/services/app-service";
import { getAllTools } from "@/lib/services/tool-service";
import { getAllGuides } from "@/lib/services/guide-service";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters and hyphens only"),
  sectionType: z.enum(["GAME", "APP", "TOOL", "GUIDE"]),
});

export async function createCategoryAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("create");

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const sectionType = (formData.get("sectionType") as "GAME" | "APP" | "TOOL" | "GUIDE") || "GAME";

  const parsed = categorySchema.safeParse({ name, slug, sectionType });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  try {
    const cat = await createCategory(parsed.data);
    await recordAudit({
      userId: session.userId,
      action: "CREATE",
      entityType: "Category",
      entityId: cat.id,
      entitySlug: cat.slug,
      metadata: { name: cat.name, sectionType: cat.sectionType },
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export interface ReferencedItem {
  type: "Game" | "App" | "Tool" | "Guide";
  title: string;
  slug: string;
}

export async function deleteCategoryAction(
  id: string
): Promise<{ success: boolean; error?: string; referencedBy?: ReferencedItem[] }> {
  const session = await requirePermission("delete");
  try {
    const allCategories = await getCategories();
    const cat = allCategories.find((c) => c.id === id || c.slug === id);

    if (cat) {
      const referencedBy: ReferencedItem[] = [];
      const catSlugNorm = cat.slug.toLowerCase();
      const catNameNorm = cat.name.toLowerCase();

      // 1. Check Games
      const games = await getAllGames();
      for (const g of games) {
        const gCat = (g.category || "").toLowerCase();
        if (gCat === catSlugNorm || gCat === catNameNorm) {
          referencedBy.push({ type: "Game", title: g.name, slug: g.slug });
        }
      }

      // 2. Check Apps
      const apps = await getAllApps();
      for (const a of apps) {
        const aCat = (a.category || "").toLowerCase();
        if (aCat === catSlugNorm || aCat === catNameNorm) {
          referencedBy.push({ type: "App", title: a.name, slug: a.slug });
        }
      }

      // 3. Check Tools
      const tools = await getAllTools();
      for (const t of tools) {
        const tCat = (t.category || "").toLowerCase();
        if (tCat === catSlugNorm || tCat === catNameNorm) {
          referencedBy.push({ type: "Tool", title: t.name, slug: t.slug });
        }
      }

      // 4. Check Guides
      const guides = await getAllGuides();
      for (const gu of guides) {
        const guCat = (gu.category || "").toLowerCase();
        if (guCat === catSlugNorm || guCat === catNameNorm) {
          referencedBy.push({ type: "Guide", title: gu.title, slug: gu.slug });
        }
      }

      if (referencedBy.length > 0) {
        const preview = referencedBy
          .slice(0, 3)
          .map((r) => `${r.type}: "${r.title}"`)
          .join(", ");
        const more = referencedBy.length > 3 ? ` and ${referencedBy.length - 3} more` : "";
        return {
          success: false,
          error: `Cannot delete category "${cat.name}": currently referenced by ${referencedBy.length} item(s) (${preview}${more}). Reassign or delete these items first.`,
          referencedBy,
        };
      }
    }

    await deleteCategory(id);
    await recordAudit({
      userId: session.userId,
      action: "DELETE",
      entityType: "Category",
      entityId: id,
      entitySlug: cat?.slug,
      metadata: { name: cat?.name },
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}
