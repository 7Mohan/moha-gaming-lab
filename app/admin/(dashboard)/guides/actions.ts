"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import {
  createGuide,
  updateGuide,
  deleteGuide,
  setGuideStatus,
  getGuideById,
  getGuideBySlug,
} from "@/lib/services/guide-service";
import type {
  Guide,
  GuideCategory,
  GuideContentType,
  GuideDifficulty,
  GuideSection,
  GuideFaq,
} from "@/types/guide";

const guideSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(2, "Category is required"),
  contentType: z.string().default("Guide"),
  difficulty: z.string().default("Beginner"),
  readingTimeMinutes: z.number().min(1).default(5),
  authorName: z.string().min(2, "Author name is required"),
  authorRole: z.string().optional().nullable(),
  status: z.enum(["draft", "review", "published", "archived"]),
  featured: z.boolean().default(false),
  sectionsJson: z.string().optional(),
  faqsJson: z.string().optional(),
  tags: z.array(z.string()).default([]),
  gameIds: z.array(z.string()).default([]),
  toolIds: z.array(z.string()).default([]),
  appIds: z.array(z.string()).default([]),
  relatedGuideSlugs: z.array(z.string()).default([]),
});

export type GuideActionResult =
  | { success: true; guideId: string; slug: string }
  | { success: false; error: string; fields?: Record<string, string[]> };

export async function createGuideAction(
  prevState: GuideActionResult | null,
  formData: FormData
): Promise<GuideActionResult> {
  const session = await requirePermission("create");

  const rawTags = (formData.get("tags") as string) || "";
  const sectionsJson = (formData.get("sectionsJson") as string) || "[]";
  const faqsJson = (formData.get("faqsJson") as string) || "[]";
  const rawGameIds = (formData.get("gameIds") as string) || "";
  const rawToolIds = (formData.get("toolIds") as string) || "";
  const rawAppIds = (formData.get("appIds") as string) || "";
  const rawRelatedGuideSlugs = (formData.get("relatedGuideSlugs") as string) || "";

  let sections: GuideSection[] = [];
  try {
    sections = JSON.parse(sectionsJson);
  } catch {
    sections = [];
  }

  let faqs: GuideFaq[] = [];
  try {
    faqs = JSON.parse(faqsJson);
  } catch {
    faqs = [];
  }

  const payload = {
    title: (formData.get("title") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    excerpt: (formData.get("excerpt") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    category: (formData.get("category") as string)?.trim(),
    contentType: (formData.get("contentType") as string)?.trim() || "Guide",
    difficulty: (formData.get("difficulty") as string)?.trim() || "Beginner",
    readingTimeMinutes: formData.get("readingTimeMinutes") ? Number(formData.get("readingTimeMinutes")) : 5,
    authorName: (formData.get("authorName") as string)?.trim() || session.name,
    authorRole: (formData.get("authorRole") as string)?.trim() || "Author",
    status: (formData.get("status") as string)?.trim() || "draft",
    featured: formData.get("featured") === "true" || formData.get("featured") === "on",
    tags: rawTags.split(",").map((s) => s.trim()).filter(Boolean),
    sectionsJson,
    faqsJson,
    gameIds: rawGameIds.split(",").map((s) => s.trim()).filter(Boolean),
    toolIds: rawToolIds.split(",").map((s) => s.trim()).filter(Boolean),
    appIds: rawAppIds.split(",").map((s) => s.trim()).filter(Boolean),
    relatedGuideSlugs: rawRelatedGuideSlugs.split(",").map((s) => s.trim()).filter(Boolean),
  };

  const parsed = guideSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  // Check unique slug
  const existing = await getGuideBySlug(parsed.data.slug);
  if (existing) {
    return { success: false, error: "A guide with this slug already exists." };
  }

  const id = `guide-${parsed.data.slug}`;
  const now = new Date().toISOString();

  const newGuide: Guide = {
    id,
    slug: parsed.data.slug,
    title: parsed.data.title,
    description: parsed.data.description,
    excerpt: parsed.data.excerpt,
    category: parsed.data.category as GuideCategory,
    contentType: parsed.data.contentType as GuideContentType,
    difficulty: parsed.data.difficulty as GuideDifficulty,
    readingTimeMinutes: parsed.data.readingTimeMinutes,
    sections,
    faqs,
    author: {
      name: parsed.data.authorName,
      role: parsed.data.authorRole || undefined,
    },
    tags: parsed.data.tags,
    gameIds: parsed.data.gameIds,
    toolIds: parsed.data.toolIds,
    appIds: parsed.data.appIds,
    relatedGuideSlugs: parsed.data.relatedGuideSlugs,
    publishedAt: now,
    updatedAt: now,
    status: parsed.data.status as Guide["status"],
    version: "1.0",
    featured: parsed.data.featured,
  };

  await createGuide(newGuide);

  await recordAudit({
    userId: session.userId,
    action: "CREATE",
    entityType: "Guide",
    entityId: id,
    entitySlug: newGuide.slug,
    metadata: { title: newGuide.title, status: newGuide.status },
  });

  revalidatePath("/guides");
  revalidatePath("/admin/guides");
  revalidatePath("/admin");

  return { success: true, guideId: id, slug: newGuide.slug };
}

export async function updateGuideAction(
  id: string,
  prevState: GuideActionResult | null,
  formData: FormData
): Promise<GuideActionResult> {
  const session = await requirePermission("update");

  const rawTags = (formData.get("tags") as string) || "";
  const sectionsJson = (formData.get("sectionsJson") as string) || "[]";
  const faqsJson = (formData.get("faqsJson") as string) || "[]";
  const rawGameIds = (formData.get("gameIds") as string) || "";
  const rawToolIds = (formData.get("toolIds") as string) || "";
  const rawAppIds = (formData.get("appIds") as string) || "";
  const rawRelatedGuideSlugs = (formData.get("relatedGuideSlugs") as string) || "";

  let sections: GuideSection[] = [];
  try {
    sections = JSON.parse(sectionsJson);
  } catch {
    sections = [];
  }

  let faqs: GuideFaq[] = [];
  try {
    faqs = JSON.parse(faqsJson);
  } catch {
    faqs = [];
  }

  const payload = {
    title: (formData.get("title") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    excerpt: (formData.get("excerpt") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    category: (formData.get("category") as string)?.trim(),
    contentType: (formData.get("contentType") as string)?.trim() || "Guide",
    difficulty: (formData.get("difficulty") as string)?.trim() || "Beginner",
    readingTimeMinutes: formData.get("readingTimeMinutes") ? Number(formData.get("readingTimeMinutes")) : 5,
    authorName: (formData.get("authorName") as string)?.trim() || session.name,
    authorRole: (formData.get("authorRole") as string)?.trim() || "Author",
    status: (formData.get("status") as string)?.trim() || "draft",
    featured: formData.get("featured") === "true" || formData.get("featured") === "on",
    tags: rawTags.split(",").map((s) => s.trim()).filter(Boolean),
    sectionsJson,
    faqsJson,
    gameIds: rawGameIds.split(",").map((s) => s.trim()).filter(Boolean),
    toolIds: rawToolIds.split(",").map((s) => s.trim()).filter(Boolean),
    appIds: rawAppIds.split(",").map((s) => s.trim()).filter(Boolean),
    relatedGuideSlugs: rawRelatedGuideSlugs.split(",").map((s) => s.trim()).filter(Boolean),
  };

  const parsed = guideSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const updated = await updateGuide(id, {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description,
    excerpt: parsed.data.excerpt,
    category: parsed.data.category as GuideCategory,
    contentType: parsed.data.contentType as GuideContentType,
    difficulty: parsed.data.difficulty as GuideDifficulty,
    readingTimeMinutes: parsed.data.readingTimeMinutes,
    sections,
    faqs,
    author: {
      name: parsed.data.authorName,
      role: parsed.data.authorRole || undefined,
    },
    tags: parsed.data.tags,
    gameIds: parsed.data.gameIds,
    toolIds: parsed.data.toolIds,
    appIds: parsed.data.appIds,
    relatedGuideSlugs: parsed.data.relatedGuideSlugs,
    status: parsed.data.status as Guide["status"],
    featured: parsed.data.featured,
    updatedAt: new Date().toISOString(),
  });

  await recordAudit({
    userId: session.userId,
    action: "UPDATE",
    entityType: "Guide",
    entityId: id,
    entitySlug: updated.slug,
    metadata: { title: updated.title, status: updated.status },
  });

  revalidatePath("/guides");
  revalidatePath(`/guides/${updated.slug}`);
  revalidatePath("/admin/guides");
  revalidatePath("/admin");

  return { success: true, guideId: id, slug: updated.slug };
}

export async function publishGuideAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("publish");
  try {
    const guide = await getGuideById(id);
    await setGuideStatus(id, "published");
    await recordAudit({
      userId: session.userId,
      action: "PUBLISH",
      entityType: "Guide",
      entityId: id,
      entitySlug: guide?.slug,
    });
    revalidatePath("/guides");
    revalidatePath("/admin/guides");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function submitForReviewAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("submitReview");
  try {
    const guide = await getGuideById(id);
    await setGuideStatus(id, "review");
    await recordAudit({
      userId: session.userId,
      action: "SUBMIT_REVIEW",
      entityType: "Guide",
      entityId: id,
      entitySlug: guide?.slug,
    });
    revalidatePath("/admin/guides");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function deleteGuideAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("delete");
  try {
    const guide = await getGuideById(id);
    await deleteGuide(id);
    await recordAudit({
      userId: session.userId,
      action: "DELETE",
      entityType: "Guide",
      entityId: id,
      entitySlug: guide?.slug,
    });
    revalidatePath("/guides");
    revalidatePath("/admin/guides");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function approveReviewAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("publish");
  try {
    const guide = await getGuideById(id);
    if (!guide) return { success: false, error: "Guide not found" };
    if (guide.status !== "review") {
      return { success: false, error: "Guide is not in the review queue." };
    }
    await updateGuide(id, {
      status: "published",
      reviewNote: undefined,
      updatedAt: new Date().toISOString(),
    });
    await recordAudit({
      userId: session.userId,
      action: "PUBLISH",
      entityType: "Guide",
      entityId: id,
      entitySlug: guide.slug,
      metadata: { approvedFrom: "review" },
    });
    revalidatePath("/guides");
    revalidatePath(`/guides/${guide.slug}`);
    revalidatePath("/admin/guides");
    revalidatePath("/admin/review");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function requestChangesAction(
  id: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("update");
  const trimmed = note?.trim();
  if (!trimmed || trimmed.length < 10) {
    return { success: false, error: "An editorial note explaining required changes is required (minimum 10 characters)." };
  }
  try {
    const guide = await getGuideById(id);
    if (!guide) return { success: false, error: "Guide not found" };
    await updateGuide(id, {
      status: "draft",
      reviewNote: trimmed,
      updatedAt: new Date().toISOString(),
    });
    await recordAudit({
      userId: session.userId,
      action: "UPDATE",
      entityType: "Guide",
      entityId: id,
      entitySlug: guide.slug,
      metadata: { action: "request_changes", note: trimmed },
    });
    revalidatePath("/admin/guides");
    revalidatePath("/admin/review");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}
