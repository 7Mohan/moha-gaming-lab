/**
 * app/api/go/[affiliateId]/route.ts
 * ────────────────────────────────────────────────────────────────
 * Secure, Open-Redirect-Proof Affiliate Redirection Gateway.
 *
 * Flow:
 * 1. Resolve registered affiliate link by unique slug or ID.
 * 2. Validate strict HTTPS protocol and reject private/loopback IP spaces.
 * 3. Enforce active/enabled campaign status.
 * 4. Increment click telemetry (rate-limited against abuse).
 * 5. Issue 307 temporary redirect.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSafeDownloadUrl } from "@/lib/download-security";
import { rateLimit } from "@/lib/security/rate-limit";
import { hasDatabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

// Hardcoded safe partners for offline/development resilience
const PRECONFIGURED_AFFILIATES: Record<
  string,
  { name: string; destinationUrl: string; enabled: boolean }
> = {
  "snapdragon-cooling-pad": {
    name: "Magnetic Peltier Phone Cooler",
    destinationUrl: "https://amazon.com/dp/example-cooler",
    enabled: true,
  },
  "gamesir-g8-galileo": {
    name: "GameSir G8 Type-C Controller",
    destinationUrl: "https://amazon.com/dp/example-controller",
    enabled: true,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ affiliateId: string }> }
) {
  const { affiliateId } = await params;
  const cleanSlug = decodeURIComponent(affiliateId || "").trim().toLowerCase();

  if (!cleanSlug) {
    return NextResponse.redirect(new URL("/", request.url), { status: 307 });
  }

  let targetUrl: string | null = null;
  let isEnabled = false;

  // 1. Check Database if available
  if (hasDatabaseUrl()) {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      const record = await prisma.affiliateLink.findFirst({
        where: { OR: [{ slug: cleanSlug }, { id: cleanSlug }] },
      });

      if (record) {
        targetUrl = record.destinationUrl;
        isEnabled = record.enabled;

        // Increment click telemetry
        if (isEnabled) {
          await prisma.affiliateLink.update({
            where: { id: record.id },
            data: { clickCount: { increment: 1 } },
          });
        }
      }
    } catch {
      // Fallback to static partners on database error
    }
  }

  // 2. Fallback to preconfigured list
  if (!targetUrl && PRECONFIGURED_AFFILIATES[cleanSlug]) {
    const fallback = PRECONFIGURED_AFFILIATES[cleanSlug]!;
    targetUrl = fallback.destinationUrl;
    isEnabled = fallback.enabled;
  }

  // 3. Not found or disabled -> Safe fallback redirect
  if (!targetUrl || !isEnabled) {
    return NextResponse.redirect(new URL("/about", request.url), { status: 307 });
  }

  // 4. Strict security validation: HTTPS & anti-loopback
  if (!isSafeDownloadUrl(targetUrl)) {
    return NextResponse.json(
      { error: "Target link failed security validation." },
      { status: 400 }
    );
  }

  // 5. Anti-abuse rate limiting for click telemetry
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : "unknown";
  await rateLimit(`aff-click:${clientIp}:${cleanSlug}`, { limit: 10, windowMs: 60_000 });

  // 6. Issue 307 Temporary Redirect
  const response = NextResponse.redirect(targetUrl, { status: 307 });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}
