"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import {
  createTool,
  updateTool,
  deleteTool,
  getToolById,
  getToolBySlug,
} from "@/lib/services/tool-service";
import type { Tool, ToolCategory, ToolPlatform, ToolStatus } from "@/types/tool";
import { invalidateSearchIndex } from "@/lib/search";

function parseSlugs(raw: string): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function assertNoExecutableScript(fields: Record<string, unknown>) {
  const DANGEROUS_PATTERNS = [
    /javascript\s*:/i,
    /<\s*script\b[^>]*>/i,
    /eval\s*\(/i,
    /on(load|error|click|mouseover)\s*=/i,
  ];
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "string") {
      for (const pat of DANGEROUS_PATTERNS) {
        if (pat.test(value)) {
          throw new Error(`Security validation failed: field "${key}" contains forbidden executable script patterns.`);
        }
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          for (const pat of DANGEROUS_PATTERNS) {
            if (pat.test(item)) {
              throw new Error(`Security validation failed: field "${key}" contains forbidden executable script patterns.`);
            }
          }
        }
      }
    }
  }
}

const toolSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, and hyphens only"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().default("performance"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  status: z.enum(["available", "beta", "coming-soon", "maintenance"]),
  whatItDoes: z.string().min(10, "What It Does explanation is required"),
  technicalExplanation: z.string().min(10, "Technical explanation is required"),
  whatItMeasures: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  howToInterpret: z.array(z.string()).default([]),
  relatedGameSlugs: z.array(z.string()).default([]),
  relatedGuideSlugs: z.array(z.string()).default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  requiresWebGl: z.boolean().default(false),
  requiresRoot: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export type ToolActionResult =
  | { success: true; toolId: string; slug: string }
  | { success: false; error: string; fields?: Record<string, string[]> };

export async function createToolAction(
  prevState: ToolActionResult | null,
  formData: FormData
): Promise<ToolActionResult> {
  const session = await requirePermission("create");

  const rawMeasures = (formData.get("whatItMeasures") as string) || "";
  const rawCaps = (formData.get("capabilities") as string) || "";
  const rawLimits = (formData.get("limitations") as string) || "";
  const rawInterp = (formData.get("howToInterpret") as string) || "";
  const rawPlatforms = (formData.get("platforms") as string) || "web";
  const rawGames = (formData.get("relatedGameSlugs") as string) || "";
  const rawGuides = (formData.get("relatedGuideSlugs") as string) || "";

  const payload = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    shortDescription: (formData.get("shortDescription") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    category: (formData.get("category") as string)?.trim() || "performance",
    platforms: rawPlatforms.split(",").map((s) => s.trim()).filter(Boolean),
    status: (formData.get("status") as string)?.trim() || "available",
    whatItDoes: (formData.get("whatItDoes") as string)?.trim(),
    technicalExplanation: (formData.get("technicalExplanation") as string)?.trim(),
    whatItMeasures: rawMeasures.split("\n").map((s) => s.trim()).filter(Boolean),
    capabilities: rawCaps.split("\n").map((s) => s.trim()).filter(Boolean),
    limitations: rawLimits.split("\n").map((s) => s.trim()).filter(Boolean),
    howToInterpret: rawInterp.split("\n").map((s) => s.trim()).filter(Boolean),
    relatedGameSlugs: parseSlugs(rawGames),
    relatedGuideSlugs: parseSlugs(rawGuides),
    difficulty: (formData.get("difficulty") as string)?.trim() || "beginner",
    requiresWebGl: formData.get("requiresWebGl") === "true" || formData.get("requiresWebGl") === "on",
    requiresRoot: formData.get("requiresRoot") === "true" || formData.get("requiresRoot") === "on",
    featured: formData.get("featured") === "true" || formData.get("featured") === "on",
  };

  try {
    assertNoExecutableScript(payload);
  } catch (secErr) {
    return { success: false, error: String(secErr instanceof Error ? secErr.message : secErr) };
  }

  const parsed = toolSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const existing = await getToolBySlug(parsed.data.slug);
  if (existing) {
    return { success: false, error: "A tool with this slug already exists." };
  }

  const id = `tool-${parsed.data.slug}`;
  const newTool: Tool = {
    id,
    slug: parsed.data.slug,
    name: parsed.data.name,
    shortDescription: parsed.data.shortDescription,
    description: parsed.data.description,
    excerpt: parsed.data.shortDescription,
    category: parsed.data.category as ToolCategory,
    platforms: parsed.data.platforms as ToolPlatform[],
    status: parsed.data.status as ToolStatus,
    whatItDoes: parsed.data.whatItDoes,
    whatItMeasures: parsed.data.whatItMeasures,
    capabilities: parsed.data.capabilities,
    limitations: parsed.data.limitations,
    technicalExplanation: parsed.data.technicalExplanation,
    howToInterpret: parsed.data.howToInterpret,
    difficulty: parsed.data.difficulty,
    requiresWebGl: parsed.data.requiresWebGl,
    requiresRoot: parsed.data.requiresRoot,
    featured: parsed.data.featured,
    tags: parsed.data.capabilities,
    relatedToolSlugs: [],
    relatedGuideSlugs: parsed.data.relatedGuideSlugs,
    relatedGameSlugs: parsed.data.relatedGameSlugs,
    requirements: {
      minApiLevel: null,
      requiresRoot: parsed.data.requiresRoot,
      isWebBased: !parsed.data.platforms || parsed.data.platforms.includes("web"),
    },
  };

  await createTool(newTool);
  invalidateSearchIndex();

  await recordAudit({
    userId: session.userId,
    action: "CREATE",
    entityType: "Tool",
    entityId: id,
    entitySlug: newTool.slug,
    metadata: { name: newTool.name },
  });

  revalidatePath("/tools");
  revalidatePath("/admin/tools");
  revalidatePath("/admin");

  return { success: true, toolId: id, slug: newTool.slug };
}

export async function updateToolAction(
  id: string,
  prevState: ToolActionResult | null,
  formData: FormData
): Promise<ToolActionResult> {
  const session = await requirePermission("update");

  const rawMeasures = (formData.get("whatItMeasures") as string) || "";
  const rawCaps = (formData.get("capabilities") as string) || "";
  const rawLimits = (formData.get("limitations") as string) || "";
  const rawInterp = (formData.get("howToInterpret") as string) || "";
  const rawPlatforms = (formData.get("platforms") as string) || "web";
  const rawGames = (formData.get("relatedGameSlugs") as string) || "";
  const rawGuides = (formData.get("relatedGuideSlugs") as string) || "";

  const payload = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    shortDescription: (formData.get("shortDescription") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    category: (formData.get("category") as string)?.trim() || "performance",
    platforms: rawPlatforms.split(",").map((s) => s.trim()).filter(Boolean),
    status: (formData.get("status") as string)?.trim() || "available",
    whatItDoes: (formData.get("whatItDoes") as string)?.trim(),
    technicalExplanation: (formData.get("technicalExplanation") as string)?.trim(),
    whatItMeasures: rawMeasures.split("\n").map((s) => s.trim()).filter(Boolean),
    capabilities: rawCaps.split("\n").map((s) => s.trim()).filter(Boolean),
    limitations: rawLimits.split("\n").map((s) => s.trim()).filter(Boolean),
    howToInterpret: rawInterp.split("\n").map((s) => s.trim()).filter(Boolean),
    relatedGameSlugs: parseSlugs(rawGames),
    relatedGuideSlugs: parseSlugs(rawGuides),
    difficulty: (formData.get("difficulty") as string)?.trim() || "beginner",
    requiresWebGl: formData.get("requiresWebGl") === "true" || formData.get("requiresWebGl") === "on",
    requiresRoot: formData.get("requiresRoot") === "true" || formData.get("requiresRoot") === "on",
    featured: formData.get("featured") === "true" || formData.get("featured") === "on",
  };

  try {
    assertNoExecutableScript(payload);
  } catch (secErr) {
    return { success: false, error: String(secErr instanceof Error ? secErr.message : secErr) };
  }

  const parsed = toolSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const updated = await updateTool(id, {
    name: parsed.data.name,
    slug: parsed.data.slug,
    shortDescription: parsed.data.shortDescription,
    description: parsed.data.description,
    excerpt: parsed.data.shortDescription,
    category: parsed.data.category as ToolCategory,
    platforms: parsed.data.platforms as ToolPlatform[],
    status: parsed.data.status as ToolStatus,
    whatItDoes: parsed.data.whatItDoes,
    whatItMeasures: parsed.data.whatItMeasures,
    capabilities: parsed.data.capabilities,
    limitations: parsed.data.limitations,
    technicalExplanation: parsed.data.technicalExplanation,
    howToInterpret: parsed.data.howToInterpret,
    difficulty: parsed.data.difficulty,
    requiresWebGl: parsed.data.requiresWebGl,
    requiresRoot: parsed.data.requiresRoot,
    featured: parsed.data.featured,
    relatedGameSlugs: parsed.data.relatedGameSlugs,
    relatedGuideSlugs: parsed.data.relatedGuideSlugs,
  });

  invalidateSearchIndex();

  await recordAudit({
    userId: session.userId,
    action: "UPDATE",
    entityType: "Tool",
    entityId: id,
    entitySlug: updated.slug,
    metadata: { name: updated.name },
  });

  revalidatePath("/tools");
  revalidatePath(`/tools/${updated.slug}`);
  revalidatePath("/admin/tools");
  revalidatePath("/admin");

  return { success: true, toolId: id, slug: updated.slug };
}

export async function deleteToolAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("delete");
  try {
    const tool = await getToolById(id);
    await deleteTool(id);
    invalidateSearchIndex();
    await recordAudit({
      userId: session.userId,
      action: "DELETE",
      entityType: "Tool",
      entityId: id,
      entitySlug: tool?.slug,
    });
    revalidatePath("/tools");
    revalidatePath("/admin/tools");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}
