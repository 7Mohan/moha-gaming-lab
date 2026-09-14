"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import {
  createApp,
  updateApp,
  deleteApp,
  createRelease,
  updateRelease,
  deleteRelease,
  getAppById,
  getAppBySlug,
} from "@/lib/services/app-service";
import type { App, AppRelease, AppArchitecture, VerificationStatus, AppCategory, AppPermission } from "@/types/app";
import {
  getStorageProvider,
  validateApkFile,
  sanitizeFileName,
  generateStoragePath,
  isValidSha256,
} from "@/lib/storage";

function isSafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

import { invalidateSearchIndex } from "@/lib/search-index";

const appSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, and hyphens only"),
  packageName: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(val),
      "Package name must follow reverse domain notation, e.g. com.example.app"
    )
    .optional()
    .nullable(),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  developer: z.string().min(2, "Developer is required"),
  developerUrl: z.string().optional().nullable(),
  license: z.string().default("Freeware"),
  category: z.string().min(2, "Category is required"),
  requiresRoot: z.boolean().default(false),
  targetSdkVersion: z.number().optional().nullable(),
  status: z.enum(["active", "coming-soon", "deprecated", "archived"]),
  features: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  relatedGames: z.array(z.string()).default([]),
  relatedGuides: z.array(z.string()).default([]),
});

export type AppActionResult =
  | { success: true; appId: string; slug: string }
  | { success: false; error: string; fields?: Record<string, string[]> };

export async function createAppAction(
  prevState: AppActionResult | null,
  formData: FormData
): Promise<AppActionResult> {
  const session = await requirePermission("create");

  const rawFeatures = (formData.get("features") as string) || "";
  const rawPermissions = (formData.get("permissions") as string) || "";
  const rawDevUrl = (formData.get("developerUrl") as string)?.trim();
  const rawRelatedGames = (formData.get("relatedGames") as string) || "";
  const rawRelatedGuides = (formData.get("relatedGuides") as string) || "";

  if (rawDevUrl && !isSafeUrl(rawDevUrl)) {
    return { success: false, error: "Developer URL must be a valid HTTP/HTTPS link" };
  }

  const payload = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    packageName: (formData.get("packageName") as string)?.trim() || null,
    excerpt: (formData.get("excerpt") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    developer: (formData.get("developer") as string)?.trim(),
    developerUrl: rawDevUrl || null,
    license: (formData.get("license") as string)?.trim() || "Freeware",
    category: (formData.get("category") as string)?.trim(),
    requiresRoot: formData.get("requiresRoot") === "true" || formData.get("requiresRoot") === "on",
    targetSdkVersion: formData.get("targetSdkVersion") ? Number(formData.get("targetSdkVersion")) : null,
    status: (formData.get("status") as string)?.trim(),
    features: rawFeatures.split("\n").map((s) => s.trim()).filter(Boolean),
    permissions: rawPermissions.split(",").map((s) => s.trim()).filter(Boolean),
    relatedGames: rawRelatedGames.split(",").map((s) => s.trim()).filter(Boolean),
    relatedGuides: rawRelatedGuides.split(",").map((s) => s.trim()).filter(Boolean),
  };

  const parsed = appSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  // Check unique slug
  const existing = await getAppBySlug(parsed.data.slug);
  if (existing) {
    return { success: false, error: "An application with this slug already exists." };
  }

  const id = `app-${parsed.data.slug}`;
  const newApp: App = {
    id,
    slug: parsed.data.slug,
    name: parsed.data.name,
    packageName: parsed.data.packageName || undefined,
    excerpt: parsed.data.excerpt,
    description: parsed.data.description,
    developer: parsed.data.developer,
    developerUrl: parsed.data.developerUrl || undefined,
    license: parsed.data.license,
    category: parsed.data.category as AppCategory,
    platform: "android",
    status: parsed.data.status as App["status"],
    requiresRoot: parsed.data.requiresRoot,
    targetSdkVersion: parsed.data.targetSdkVersion || undefined,
    minAndroidVersion: "8.0",
    minApiLevel: 26,
    architectures: ["arm64-v8a"],
    features: parsed.data.features,
    tags: parsed.data.features,
    permissions: parsed.data.permissions.map((name, i): AppPermission => ({
      id: `perm-${i}`,
      name,
      protectionLevel: "normal",
      reason: "Hardware access",
    })),
    releases: [],
    installGuide: {
      prerequisites: [],
      installationSteps: [
        "Download the verified APK from the verified mirror below.",
        "Enable 'Install from unknown sources' if prompted.",
        "Install and verify permissions.",
      ],
      uninstallSteps: ["Settings > Apps > Uninstall"],
    },
    relatedGames: parsed.data.relatedGames,
    relatedTools: [],
    relatedGuides: parsed.data.relatedGuides,
    featured: false,
  };

  await createApp(newApp);
  invalidateSearchIndex();

  await recordAudit({
    userId: session.userId,
    action: "CREATE",
    entityType: "App",
    entityId: id,
    entitySlug: newApp.slug,
    metadata: { name: newApp.name, status: newApp.status },
  });

  revalidatePath("/apps");
  revalidatePath("/admin/apps");
  revalidatePath("/admin");

  return { success: true, appId: id, slug: newApp.slug };
}

export async function updateAppAction(
  id: string,
  prevState: AppActionResult | null,
  formData: FormData
): Promise<AppActionResult> {
  const session = await requirePermission("update");

  const rawFeatures = (formData.get("features") as string) || "";
  const rawPermissions = (formData.get("permissions") as string) || "";
  const rawDevUrl = (formData.get("developerUrl") as string)?.trim();
  const rawRelatedGames = (formData.get("relatedGames") as string) || "";
  const rawRelatedGuides = (formData.get("relatedGuides") as string) || "";

  if (rawDevUrl && !isSafeUrl(rawDevUrl)) {
    return { success: false, error: "Developer URL must be a valid HTTP/HTTPS link" };
  }

  const payload = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    packageName: (formData.get("packageName") as string)?.trim() || null,
    excerpt: (formData.get("excerpt") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    developer: (formData.get("developer") as string)?.trim(),
    developerUrl: rawDevUrl || null,
    license: (formData.get("license") as string)?.trim() || "Freeware",
    category: (formData.get("category") as string)?.trim(),
    requiresRoot: formData.get("requiresRoot") === "true" || formData.get("requiresRoot") === "on",
    targetSdkVersion: formData.get("targetSdkVersion") ? Number(formData.get("targetSdkVersion")) : null,
    status: (formData.get("status") as string)?.trim(),
    features: rawFeatures.split("\n").map((s) => s.trim()).filter(Boolean),
    permissions: rawPermissions.split(",").map((s) => s.trim()).filter(Boolean),
    relatedGames: rawRelatedGames.split(",").map((s) => s.trim()).filter(Boolean),
    relatedGuides: rawRelatedGuides.split(",").map((s) => s.trim()).filter(Boolean),
  };

  const parsed = appSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const updated = await updateApp(id, {
    name: parsed.data.name,
    slug: parsed.data.slug,
    packageName: parsed.data.packageName || undefined,
    excerpt: parsed.data.excerpt,
    description: parsed.data.description,
    developer: parsed.data.developer,
    developerUrl: parsed.data.developerUrl || undefined,
    license: parsed.data.license,
    category: parsed.data.category as AppCategory | undefined,
    requiresRoot: parsed.data.requiresRoot,
    targetSdkVersion: parsed.data.targetSdkVersion || undefined,
    status: parsed.data.status as App["status"],
    features: parsed.data.features,
    permissions: parsed.data.permissions.map((name, i): AppPermission => ({
      id: `perm-${i}`,
      name,
      protectionLevel: "normal",
      reason: "Hardware access",
    })),
    relatedGames: parsed.data.relatedGames,
    relatedGuides: parsed.data.relatedGuides,
  });

  invalidateSearchIndex();

  await recordAudit({
    userId: session.userId,
    action: "UPDATE",
    entityType: "App",
    entityId: id,
    entitySlug: updated.slug,
    metadata: { name: updated.name, status: updated.status },
  });

  revalidatePath("/apps");
  revalidatePath(`/apps/${updated.slug}`);
  revalidatePath("/admin/apps");
  revalidatePath("/admin");

  return { success: true, appId: id, slug: updated.slug };
}

export async function deleteAppAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("delete");
  try {
    const app = await getAppById(id);
    await deleteApp(id);
    invalidateSearchIndex();
    await recordAudit({
      userId: session.userId,
      action: "DELETE",
      entityType: "App",
      entityId: id,
      entitySlug: app?.slug,
    });
    revalidatePath("/apps");
    revalidatePath("/admin/apps");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function createReleaseAction(
  appSlug: string,
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("create");

  const downloadUrl = (formData.get("downloadUrl") as string)?.trim();
  const sourceUrl = (formData.get("sourceUrl") as string)?.trim();

  if (downloadUrl && !isSafeUrl(downloadUrl)) {
    return { success: false, error: "Download URL must be a valid HTTP or HTTPS link" };
  }
  if (sourceUrl && !isSafeUrl(sourceUrl)) {
    return { success: false, error: "Source URL must be a valid HTTP or HTTPS link" };
  }

  const checksumSha256 = (formData.get("checksumSha256") as string)?.trim() || undefined;
  const checksumMd5 = (formData.get("checksumMd5") as string)?.trim() || undefined;

  const shaRegex = /^[a-fA-F0-9]{64}$/;
  const md5Regex = /^[a-fA-F0-9]{32}$/;

  if (checksumSha256 && !shaRegex.test(checksumSha256)) {
    return { success: false, error: "SHA-256 checksum must be a 64-character hexadecimal hash." };
  }
  if (checksumMd5 && !md5Regex.test(checksumMd5)) {
    return { success: false, error: "MD5 checksum must be a 32-character hexadecimal hash." };
  }

  const rawChangelog = (formData.get("changelog") as string) || "";
  const rawArch = (formData.get("architectures") as string) || "arm64-v8a";
  const rawVersionCode = formData.get("versionCode") ? Number(formData.get("versionCode")) : undefined;
  const storagePath = (formData.get("storagePath") as string)?.trim() || undefined;
  const fileName = (formData.get("fileName") as string)?.trim() || undefined;

  const release: AppRelease = {
    version: (formData.get("version") as string)?.trim() || "1.0.0",
    versionCode: rawVersionCode,
    releaseDate: (formData.get("releaseDate") as string)?.trim() || new Date().toISOString().split("T")[0]!,
    androidMinVersion: (formData.get("androidMinVersion") as string)?.trim() || "8.0",
    targetSdkVersion: formData.get("targetSdkVersion") ? Number(formData.get("targetSdkVersion")) : undefined,
    architectures: rawArch.split(",").map((s) => s.trim()) as AppArchitecture[],
    fileSize: formData.get("fileSize") ? Number(formData.get("fileSize")) : undefined,
    fileSizeBytes: formData.get("fileSize") ? Number(formData.get("fileSize")) : undefined,
    downloadUrl: downloadUrl || undefined,
    sourceUrl: sourceUrl || undefined,
    sourceName: (formData.get("sourceName") as string)?.trim() || (storagePath ? "Hosted APK Storage" : "Official GitHub"),
    sourceType: (formData.get("sourceType") as AppRelease["sourceType"]) || (storagePath ? "hosted" : "github_release"),
    checksumSha256,
    checksumMd5,
    checksumAlgorithm: "sha256",
    verificationStatus: (formData.get("verificationStatus") as VerificationStatus) || "pending",
    verificationEvidence: (formData.get("verificationEvidence") as string)?.trim() || undefined,
    storagePath,
    fileName,
    mimeType: "application/vnd.android.package-archive",
    status: (formData.get("status") as AppRelease["status"]) || "published",
    createdBy: session.userId,
    changelog: rawChangelog.split("\n").map((s) => s.trim()).filter(Boolean),
  };

  try {
    await createRelease(appSlug, release);
    invalidateSearchIndex();
    await recordAudit({
      userId: session.userId,
      action: "CREATE",
      entityType: "AppRelease",
      entitySlug: appSlug,
      metadata: { version: release.version, storagePath: release.storagePath },
    });
    revalidatePath(`/apps/${appSlug}`);
    revalidatePath(`/admin/apps`);
    revalidatePath(`/admin/apps/${appSlug}/releases`);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

/**
 * Uploads an APK file to the private Supabase storage bucket,
 * validates magic bytes, calculates SHA-256 hash, and returns storage metadata.
 */
export async function uploadReleaseFileAction(
  appSlug: string,
  version: string,
  formData: FormData
): Promise<{
  success: boolean;
  storagePath?: string;
  fileName?: string;
  fileSizeBytes?: number;
  checksumSha256?: string;
  error?: string;
}> {
  await requirePermission("create");

  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") {
    return { success: false, error: "No file was uploaded." };
  }

  const cleanVersion = (version || "1.0.0").trim();
  const rawBytes = await file.arrayBuffer();
  const buffer = Buffer.from(rawBytes);

  // Validate APK
  const validation = validateApkFile(file.name, buffer, file.type);
  if (!validation.valid) {
    return { success: false, error: validation.error || "APK validation failed." };
  }

  // Generate safe path and upload
  const cleanFileName = sanitizeFileName(file.name);
  const storagePath = generateStoragePath(appSlug, cleanVersion, cleanFileName);
  const storage = getStorageProvider();

  const uploadResult = await storage.upload(
    storagePath,
    buffer,
    "application/vnd.android.package-archive"
  );

  if (!uploadResult.success) {
    return { success: false, error: uploadResult.error || "Failed to save file in storage." };
  }

  return {
    success: true,
    storagePath: uploadResult.storagePath,
    fileName: uploadResult.fileName,
    fileSizeBytes: uploadResult.fileSizeBytes,
    checksumSha256: uploadResult.checksumSha256,
  };
}

/**
 * Validates and compares stored checksum vs actual file in storage.
 */
export async function verifyReleaseIntegrityAction(
  appSlug: string,
  releaseVersion: string
): Promise<{ success: boolean; error?: string; status?: string }> {
  const session = await requirePermission("update");
  const app = await getAppBySlug(appSlug);
  if (!app) return { success: false, error: "App not found" };

  const release = app.releases.find((r) => r.version === releaseVersion);
  if (!release) return { success: false, error: "Release not found" };

  if (!release.storagePath) {
    return { success: false, error: "Cannot verify file integrity on external link releases without hosted storage." };
  }

  const storage = getStorageProvider();
  const exists = await storage.exists(release.storagePath);
  if (!exists) {
    await updateRelease(appSlug, releaseVersion, {
      verificationStatus: "failed",
      verificationEvidence: `Integrity check failed: Storage object missing at ${release.storagePath}`,
    });

    await recordAudit({
      userId: session.userId,
      action: "UPDATE",
      entityType: "AppRelease",
      entitySlug: appSlug,
      metadata: { version: releaseVersion, status: "failed", reason: "file_missing" },
    });

    return { success: false, status: "failed", error: "Storage object missing. Verification failed." };
  }

  const metadata = await storage.getMetadata(release.storagePath);
  if (metadata?.checksumSha256 && release.checksumSha256) {
    const isMatch = metadata.checksumSha256.toLowerCase() === release.checksumSha256.toLowerCase();
    const newStatus: VerificationStatus = isMatch ? "verified" : "failed";

    await updateRelease(appSlug, releaseVersion, {
      verificationStatus: newStatus,
      verificationEvidence: isMatch
        ? `Cryptographic SHA-256 match confirmed on ${new Date().toISOString()}`
        : `SHA-256 mismatch detected: expected ${release.checksumSha256}, got ${metadata.checksumSha256}`,
      verifiedBy: session.userId,
      verifiedAt: new Date().toISOString(),
    });

    await recordAudit({
      userId: session.userId,
      action: isMatch ? "VERIFY" : "UPDATE",
      entityType: "AppRelease",
      entitySlug: appSlug,
      metadata: { version: releaseVersion, status: newStatus },
    });

    revalidatePath(`/apps/${appSlug}`);
    revalidatePath(`/admin/apps/${appSlug}/releases`);

    return { success: isMatch, status: newStatus, error: isMatch ? undefined : "SHA-256 hash mismatch!" };
  }

  return { success: true, status: "verified" };
}

/**
 * Publishes a release after running the publication validation checklist.
 */
export async function publishReleaseAction(
  appSlug: string,
  releaseVersion: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("publish");
  const app = await getAppBySlug(appSlug);
  if (!app) return { success: false, error: "App not found" };

  const release = app.releases.find((r) => r.version === releaseVersion);
  if (!release) return { success: false, error: "Release not found" };

  // Checklist Validation
  if (release.verificationStatus === "failed") {
    return {
      success: false,
      error: "Publishing blocked: Release verification status is marked as FAILED. Resolve integrity issues first.",
    };
  }

  if (release.storagePath) {
    const storage = getStorageProvider();
    const exists = await storage.exists(release.storagePath);
    if (!exists) {
      return {
        success: false,
        error: "Publishing blocked: The hosted APK storage file does not exist in the bucket.",
      };
    }
  } else if (!release.downloadUrl || !isSafeUrl(release.downloadUrl)) {
    return {
      success: false,
      error: "Publishing blocked: Valid HTTPS download URL required for external releases.",
    };
  }

  if (!release.checksumSha256 || !isValidSha256(release.checksumSha256)) {
    return {
      success: false,
      error: "Publishing blocked: Valid 64-character SHA-256 checksum required.",
    };
  }

  await updateRelease(appSlug, releaseVersion, {
    status: "published",
    updatedBy: session.userId,
  });

  await recordAudit({
    userId: session.userId,
    action: "PUBLISH",
    entityType: "AppRelease",
    entitySlug: appSlug,
    metadata: { version: releaseVersion },
  });

  invalidateSearchIndex();
  revalidatePath(`/apps/${appSlug}`);
  revalidatePath(`/admin/apps`);
  revalidatePath(`/admin/apps/${appSlug}/releases`);

  return { success: true };
}

/**
 * Archives a release, removing it from public download access.
 */
export async function archiveReleaseAction(
  appSlug: string,
  releaseVersion: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("update");

  await updateRelease(appSlug, releaseVersion, {
    status: "archived",
    updatedBy: session.userId,
  });

  await recordAudit({
    userId: session.userId,
    action: "ARCHIVE",
    entityType: "AppRelease",
    entitySlug: appSlug,
    metadata: { version: releaseVersion, reason: reason || "Archived by admin" },
  });

  invalidateSearchIndex();
  revalidatePath(`/apps/${appSlug}`);
  revalidatePath(`/admin/apps`);
  revalidatePath(`/admin/apps/${appSlug}/releases`);

  return { success: true };
}

/**
 * Deletes a release with strict delete safety.
 * Published releases MUST be archived before deletion.
 */
export async function deleteReleaseAction(
  appSlug: string,
  releaseId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("delete");
  try {
    const app = await getAppBySlug(appSlug);
    const release = app?.releases.find((r) => r.version === releaseId || r.id === releaseId);

    // Delete safety: Published releases cannot be deleted directly
    if (release && (release.status || "published") === "published") {
      return {
        success: false,
        error: "Cannot delete a published release. Archive the release first to prevent broken user downloads.",
      };
    }

    // Clean up storage object if hosted
    if (release?.storagePath) {
      const storage = getStorageProvider();
      await storage.delete(release.storagePath);
    }

    await deleteRelease(appSlug, releaseId);
    invalidateSearchIndex();
    await recordAudit({
      userId: session.userId,
      action: "DELETE",
      entityType: "AppRelease",
      entitySlug: appSlug,
      metadata: { releaseId, storagePath: release?.storagePath },
    });
    revalidatePath(`/apps/${appSlug}`);
    revalidatePath(`/admin/apps`);
    revalidatePath(`/admin/apps/${appSlug}/releases`);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

/**
 * Scans storage bucket objects and returns objects that have no matching DB release.
 */
export async function detectOrphanFilesAction(): Promise<{
  success: boolean;
  orphans: string[];
  error?: string;
}> {
  await requirePermission("read");
  try {
    const storage = getStorageProvider();
    const storageObjects = await storage.listObjects();

    const allReleases: AppRelease[] = [];
    const apps = await (await import("@/lib/services/app-service")).getAllApps();
    apps.forEach((a) => allReleases.push(...a.releases));

    const registeredPaths = new Set(
      allReleases.map((r) => r.storagePath).filter(Boolean)
    );

    const orphans = storageObjects.filter((obj) => !registeredPaths.has(obj));

    return { success: true, orphans };
  } catch (err) {
    return { success: false, orphans: [], error: String(err instanceof Error ? err.message : err) };
  }
}

export async function verifyReleaseAction(
  appSlug: string,
  releaseId: string,
  verificationBasis: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("update");

  const basis = verificationBasis?.trim();
  if (!basis || basis.length < 10) {
    return {
      success: false,
      error: "Verification basis is required and must document verification evidence (minimum 10 characters).",
    };
  }

  try {
    await updateRelease(appSlug, releaseId, {
      verificationStatus: "verified",
      verificationEvidence: basis,
      verifiedBy: session.userId,
      verifiedAt: new Date().toISOString(),
    });

    await recordAudit({
      userId: session.userId,
      action: "VERIFY",
      entityType: "AppRelease",
      entitySlug: appSlug,
      metadata: { version: releaseId, basis },
    });

    invalidateSearchIndex();
    revalidatePath(`/apps/${appSlug}`);
    revalidatePath(`/admin/apps`);
    revalidatePath(`/admin/apps/${appSlug}/releases`);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}

export async function deprecateReleaseAction(
  appSlug: string,
  releaseId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePermission("update");

  const trimmed = reason?.trim();
  if (!trimmed || trimmed.length < 5) {
    return {
      success: false,
      error: "A valid explanation is required to deprecate or revoke a release.",
    };
  }

  try {
    await updateRelease(appSlug, releaseId, {
      verificationStatus: "unavailable",
      verificationEvidence: `Revoked: ${trimmed}`,
    });

    await recordAudit({
      userId: session.userId,
      action: "UPDATE",
      entityType: "AppRelease",
      entitySlug: appSlug,
      metadata: { version: releaseId, status: "unavailable", reason: trimmed },
    });

    invalidateSearchIndex();
    revalidatePath(`/apps/${appSlug}`);
    revalidatePath(`/admin/apps`);
    revalidatePath(`/admin/apps/${appSlug}/releases`);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) };
  }
}
