"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import { hasDatabaseUrl } from "@/lib/env";
import type { AdProviderType, AdPlacementConfig } from "@/lib/monetization/types";
import { DEFAULT_PLACEMENTS } from "@/lib/monetization/config";

// In-memory runtime override store when database is not connected
const runtimePlacementOverrides: Record<string, Partial<AdPlacementConfig>> = {};
let runtimeGlobalProvider: AdProviderType = "TEST_PLACEHOLDER";
let runtimeTestMode = true;

export async function getMonetizationStateAction() {
  await requirePermission("read");

  let placements: AdPlacementConfig[] = Object.values(DEFAULT_PLACEMENTS);
  const globalProvider = runtimeGlobalProvider;
  const isTestMode = runtimeTestMode;
  let affiliateLinks: Array<{
    id: string;
    slug: string;
    name: string;
    destinationUrl: string;
    provider?: string | null;
    enabled: boolean;
    clickCount: number;
  }> = [];

  if (hasDatabaseUrl()) {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      const dbPlacements = await prisma.adPlacement.findMany({
        orderBy: { priority: "asc" },
      });

      if (dbPlacements.length > 0) {
        placements = dbPlacements.map((p) => ({
          key: p.key,
          name: p.name,
          description: p.description || undefined,
          pageType: p.pageType,
          location: p.location,
          format: p.format,
          enabled: p.enabled,
          provider: p.provider,
          slotId: p.slotId || undefined,
          priority: p.priority,
          device: p.device,
        }));
      }

      const dbAffiliates = await prisma.affiliateLink.findMany({
        orderBy: { clickCount: "desc" },
      });
      affiliateLinks = dbAffiliates;
    } catch {
      // Use fallback defaults
    }
  } else {
    // Apply runtime overrides
    placements = placements.map((p) => ({
      ...p,
      ...(runtimePlacementOverrides[p.key] || {}),
    }));
  }

  return {
    placements,
    globalProvider,
    isTestMode,
    affiliateLinks,
  };
}

export async function togglePlacementAction(
  key: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  // Editors and Admins can toggle placements
  const session = await requirePermission("update");

  try {
    if (hasDatabaseUrl()) {
      const { prisma } = await import("@/lib/db/prisma");
      await prisma.adPlacement.upsert({
        where: { key },
        update: { enabled },
        create: {
          key,
          name: key.replace(/_/g, " "),
          location: "custom",
          enabled,
        },
      });
    } else {
      runtimePlacementOverrides[key] = {
        ...runtimePlacementOverrides[key],
        enabled,
      };
    }

    await recordAudit({
      userId: session.userId,
      action: "UPDATE",
      entityType: "AdPlacement",
      entitySlug: key,
      metadata: { enabled },
    });

    revalidatePath("/");
    revalidatePath("/apps");
    revalidatePath("/games");
    revalidatePath("/tools");
    revalidatePath("/guides");
    revalidatePath("/admin/monetization");

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function updateGlobalAdConfigAction(
  provider: AdProviderType,
  testMode: boolean
): Promise<{ success: boolean; error?: string }> {
  // Changing global provider requires ADMIN permission
  const session = await requirePermission("manageSettings");

  try {
    runtimeGlobalProvider = provider;
    runtimeTestMode = testMode;

    if (hasDatabaseUrl()) {
      const { prisma } = await import("@/lib/db/prisma");
      // Update all placements' active provider in batch
      await prisma.adPlacement.updateMany({
        data: { provider },
      });
    }

    await recordAudit({
      userId: session.userId,
      action: "UPDATE",
      entityType: "GlobalAdConfig",
      metadata: { provider, testMode },
    });

    revalidatePath("/");
    revalidatePath("/admin/monetization");

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function createAffiliateLinkAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await requirePermission("create");

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const destinationUrl = (formData.get("destinationUrl") as string)?.trim();
  const provider = (formData.get("provider") as string)?.trim() || undefined;
  const campaign = (formData.get("campaign") as string)?.trim() || undefined;

  if (!name || !slug || !destinationUrl) {
    return { success: false, error: "Name, slug, and destination URL are required." };
  }

  if (!destinationUrl.startsWith("https://")) {
    return { success: false, error: "Destination URL must begin with https://" };
  }

  try {
    if (hasDatabaseUrl()) {
      const { prisma } = await import("@/lib/db/prisma");
      await prisma.affiliateLink.create({
        data: {
          name,
          slug,
          destinationUrl,
          provider,
          campaign,
          enabled: true,
        },
      });
    }

    await recordAudit({
      userId: session.userId,
      action: "CREATE",
      entityType: "AffiliateLink",
      entitySlug: slug,
      metadata: { name, destinationUrl },
    });

    revalidatePath("/admin/monetization");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}
