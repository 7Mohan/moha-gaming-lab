/**
 * lib/download/resolver.ts
 * ────────────────────────────────────────────────────────────────
 * Production Download Resolver.
 * Resolves both hosted Supabase Storage artifacts and verified external
 * upstream mirrors with strict validation, open redirect prevention,
 * and signed URL generation.
 */

import { getStorageProvider } from "@/lib/storage";
import { isSafeDownloadUrl } from "@/lib/download-security";
import type { App, AppRelease } from "@/types/app";
import type { DownloadResolution } from "./types";

/**
 * Resolves the appropriate download destination for an app release.
 */
export async function resolveDownloadSource(
  app: App,
  release: AppRelease,
  options: { allowDrafts?: boolean } = {}
): Promise<DownloadResolution> {
  // 1. Publication status validation
  const status = (release.status || "published").toLowerCase();
  if (!options.allowDrafts && (status === "archived" || status === "draft" || status === "review")) {
    return {
      success: false,
      error: "This release is not currently published for public download.",
      statusCode: 403,
    };
  }

  // 2. Determine if hosted in Supabase Storage or external mirror
  const isHosted = Boolean(
    release.storagePath ||
    release.sourceType === "hosted" ||
    (release.sourceType === "direct" && release.storagePath)
  );

  if (isHosted && release.storagePath) {
    const storage = getStorageProvider();

    // Verify storage object actually exists
    const fileExists = await storage.exists(release.storagePath);
    if (!fileExists) {
      console.error(
        `[DownloadResolver] Missing storage object for app "${app.slug}" version "${release.version}" at "${release.storagePath}"`
      );
      return {
        success: false,
        error: "The requested release package is temporarily unavailable from storage. Please try again later.",
        statusCode: 503,
      };
    }

    // Generate 15-minute signed URL
    const signedRes = await storage.createSignedUrl(release.storagePath, 900);
    if (!signedRes.success || !signedRes.signedUrl) {
      console.error(
        `[DownloadResolver] Failed to generate signed URL for "${release.storagePath}": ${signedRes.error}`
      );
      return {
        success: false,
        error: "Unable to authorize download at this time. Please try again later.",
        statusCode: 500,
      };
    }

    return {
      success: true,
      type: "hosted",
      url: signedRes.signedUrl,
      isDirect: true,
      fileName: release.fileName || `${app.slug}-v${release.version}.apk`,
      fileSizeBytes: release.fileSize,
      checksumSha256: release.checksumSha256,
      verificationStatus: release.verificationStatus,
    };
  }

  // 3. External Release Mirror (GitHub, Official Site, F-Droid, etc.)
  const targetUrl = release.downloadUrl || release.sourceUrl;
  if (!targetUrl) {
    return {
      success: false,
      error: "No download URL is registered for this release.",
      statusCode: 404,
    };
  }

  // Enforce strict HTTPS and protocol safety
  if (!isSafeDownloadUrl(targetUrl)) {
    return {
      success: false,
      error: "The external download address failed security validation (insecure protocol or restricted host).",
      statusCode: 400,
    };
  }

  return {
    success: true,
    type: "external",
    url: targetUrl,
    isDirect: false,
    fileName: release.fileName || `${app.slug}-v${release.version}.apk`,
    fileSizeBytes: release.fileSize,
    checksumSha256: release.checksumSha256,
    verificationStatus: release.verificationStatus,
  };
}
