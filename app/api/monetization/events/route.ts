/**
 * app/api/monetization/events/route.ts
 * ────────────────────────────────────────────────────────────────
 * Privacy-preserving event endpoint for ad impressions and clicks.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/security/rate-limit";
import { hasDatabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  eventType: z.enum(["AD_IMPRESSION", "AD_CLICK", "AFFILIATE_CLICK", "SPONSORED_VIEW"]),
  placementKey: z.string().max(100).optional().nullable(),
  affiliateSlug: z.string().max(100).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : "unknown";

    // Rate limit: max 60 monetization telemetry events per minute per IP
    const rl = await rateLimit(`mono-event:${clientIp}`, { limit: 60, windowMs: 60_000 });
    if (!rl.success) {
      return new NextResponse(null, { status: 429 });
    }

    const raw = await request.json();
    const parsed = eventSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (hasDatabaseUrl()) {
      const { prisma } = await import("@/lib/db/prisma");
      await prisma.monetizationEvent.create({
        data: {
          eventType: parsed.data.eventType,
          placementKey: parsed.data.placementKey || null,
          affiliateSlug: parsed.data.affiliateSlug || null,
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
