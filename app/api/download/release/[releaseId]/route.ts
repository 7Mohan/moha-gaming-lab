/**
 * app/api/download/release/[releaseId]/route.ts
 * ────────────────────────────────────────────────────────────────
 * Secure Production Download Gateway for Moha Gaming Lab.
 *
 * Flow:
 * 1. Validate release ID and associated application.
 * 2. Enforce publication status (draft/review/archived strictly denied).
 * 3. Resolve source via resolveDownloadSource:
 *    - Hosted -> Verify storage object exists, generate 15-min signed URL.
 *    - External -> Validate strict HTTPS and safe domain.
 * 4. Record privacy-respecting download telemetry (rate-limited against abuse).
 * 5. Issue secure temporary redirect (307) without exposing internal bucket keys.
 */

import { NextRequest, NextResponse } from "next/server";
import { appRepository } from "@/lib/repositories";
import { resolveDownloadSource } from "@/lib/download/resolver";
import { rateLimit } from "@/lib/security/rate-limit";
import { hasDatabaseUrl } from "@/lib/env";
import { isDownloadsEnabled } from "@/lib/config/killswitches";
import type { App, AppRelease } from "@/types/app";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  // Emergency Killswitch check
  if (!isDownloadsEnabled()) {
    return NextResponse.json(
      { error: "Downloads are temporarily suspended for maintenance. Please check back shortly." },
      { status: 503, headers: { "Retry-After": "300" } }
    );
  }

  const { releaseId } = await params;
  const cleanReleaseId = decodeURIComponent(releaseId || "").trim();

  if (!cleanReleaseId) {
    return NextResponse.json(
      { error: "Release identifier is required." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const appSlugHint = searchParams.get("app")?.trim().toLowerCase();

  let targetApp: App | null = null;
  let targetRelease: AppRelease | null = null;

  // 1. Locate App & Release
  if (appSlugHint) {
    const app = await appRepository.getBySlug(appSlugHint);
    if (app) {
      const match = app.releases.find(
        (r) =>
          r.id === cleanReleaseId ||
          r.version === cleanReleaseId ||
          `v${r.version}` === cleanReleaseId ||
          `${app.slug}-${r.version}` === cleanReleaseId
      );
      if (match) {
        targetApp = app;
        targetRelease = match;
      }
    }
  }

  // If not resolved via hint, search across all apps
  if (!targetApp || !targetRelease) {
    const allApps = await appRepository.listAll();
    for (const app of allApps) {
      const match = app.releases.find(
        (r) =>
          r.id === cleanReleaseId ||
          r.version === cleanReleaseId ||
          `v${r.version}` === cleanReleaseId ||
          `${app.slug}-${r.version}` === cleanReleaseId
      );
      if (match) {
        targetApp = app;
        targetRelease = match;
        break;
      }
    }
  }

  // 2. 404 if app or release does not exist
  if (!targetApp || !targetRelease) {
    return NextResponse.json(
      { error: "The requested release could not be found." },
      { status: 404 }
    );
  }

  // 3. Authorization check: Published status required
  const releaseStatus = (targetRelease.status || "published").toLowerCase();
  if (releaseStatus === "archived" || releaseStatus === "draft" || releaseStatus === "review") {
    return NextResponse.json(
      { error: "This release artifact is not available for public download." },
      { status: 403 }
    );
  }

  // 4. Resolve download source (Hosted signed URL or validated external link)
  const resolution = await resolveDownloadSource(targetApp, targetRelease);
  if (!resolution.success || !resolution.url) {
    return NextResponse.json(
      { error: resolution.error || "Download resolution failed." },
      { status: resolution.statusCode || 500 }
    );
  }

  // 5. Anti-abuse rate-limited download event telemetry
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : "unknown";
  const rateLimitKey = `dl-event:${clientIp}:${targetApp.slug}:${targetRelease.version}`;

  // Limit download event records to 10 per minute per IP/version
  const rl = await rateLimit(rateLimitKey, { limit: 10, windowMs: 60_000 });
  if (rl.success && hasDatabaseUrl()) {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      await prisma.downloadEvent.create({
        data: {
          releaseId: targetRelease.id || `${targetApp.slug}-${targetRelease.version}`,
          sourceType: resolution.type === "hosted" ? "HOSTED" : "EXTERNAL",
        },
      });

      // Also record in centralized AnalyticsEvent table for Phase 14 growth metrics
      await prisma.analyticsEvent.create({
        data: {
          eventName: "DOWNLOAD_START",
          category: "downloads",
          contentType: "app",
          contentSlug: targetApp.slug,
          metadata: {
            version: targetRelease.version,
            sourceType: resolution.type === "hosted" ? "HOSTED" : "EXTERNAL",
            fileName: targetRelease.fileName || null,
          },
        },
      });
    } catch {
      // Telemetry failures must never disrupt client downloads
    }
  }

  // 6. Issue temporary redirect to the authorized artifact
  const redirectResponse = NextResponse.redirect(resolution.url, { status: 307 });
  redirectResponse.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  redirectResponse.headers.set("X-Content-Type-Options", "nosniff");

  return redirectResponse;
}
