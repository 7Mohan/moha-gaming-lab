"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import { hasDatabaseUrl } from "@/lib/env";

const seoSchema = z.object({
  metaTitle: z.string().max(70, "Title recommended under 60-70 characters"),
  metaDescription: z.string().max(160, "Description recommended under 155-160 characters"),
  canonicalUrl: z.string().optional().nullable(),
  noIndex: z.boolean().default(false),
});

export async function updateSeoAction(
  entityType: string,
  entityId: string,
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("update");

  const metaTitle = (formData.get("metaTitle") as string)?.trim() || "";
  const metaDescription = (formData.get("metaDescription") as string)?.trim() || "";
  const canonicalUrl = (formData.get("canonicalUrl") as string)?.trim() || null;
  const noIndex = formData.get("noIndex") === "true" || formData.get("noIndex") === "on";

  const parsed = seoSchema.safeParse({ metaTitle, metaDescription, canonicalUrl, noIndex });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  if (hasDatabaseUrl()) {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      // Upsert SeoMetadata record
      const existing = await prisma.seoMetadata.findFirst({
        where: { entityType: entityType.toUpperCase() as "GAME" | "APP" | "TOOL" | "GUIDE", entityId },
      });

      if (existing) {
        await prisma.seoMetadata.update({
          where: { id: existing.id },
          data: {
            metaTitle: parsed.data.metaTitle,
            metaDescription: parsed.data.metaDescription,
            canonicalUrl: parsed.data.canonicalUrl,
            noIndex: parsed.data.noIndex,
          },
        });
      } else {
        await prisma.seoMetadata.create({
          data: {
            entityType: entityType.toUpperCase() as "GAME" | "APP" | "TOOL" | "GUIDE",
            entityId,
            metaTitle: parsed.data.metaTitle,
            metaDescription: parsed.data.metaDescription,
            canonicalUrl: parsed.data.canonicalUrl,
            noIndex: parsed.data.noIndex,
          },
        });
      }
    } catch {
      // Offline fallback
    }
  }

  await recordAudit({
    userId: session.userId,
    action: "UPDATE",
    entityType: "SeoMetadata",
    entityId,
    metadata: { entityType, metaTitle: parsed.data.metaTitle },
  });

  revalidatePath("/admin/seo");
  return { success: true };
}

export async function createRedirectAction(
  sourcePath: string,
  targetPath: string,
  statusCode: number = 301,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("create");
  const { createRedirectRule } = await import("@/lib/seo/redirects");
  const res = await createRedirectRule({ sourcePath, targetPath, statusCode, description });
  if (res.success) {
    await recordAudit({
      userId: session.userId,
      action: "CREATE",
      entityType: "Redirect",
      metadata: { sourcePath, targetPath, statusCode },
    });
    revalidatePath("/admin/seo");
  }
  return res;
}

export async function deleteRedirectAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("delete");
  const { hasDatabaseUrl } = await import("@/lib/env");
  if (!hasDatabaseUrl()) return { success: false, error: "Database unavailable." };
  try {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.redirect.delete({ where: { id } });
    await recordAudit({
      userId: session.userId,
      action: "DELETE",
      entityType: "Redirect",
      entityId: id,
    });
    revalidatePath("/admin/seo");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Delete failed" };
  }
}

