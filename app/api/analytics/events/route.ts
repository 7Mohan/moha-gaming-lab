/**
 * app/api/analytics/events/route.ts
 * ────────────────────────────────────────────────────────────────
 * Privacy-preserving, rate-limited telemetry endpoint for Moha Gaming Lab.
 * Validates payloads with Zod and records to PostgreSQL.
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { hasDatabaseUrl } from "@/lib/env";
import { validateAnalyticsPayload } from "@/lib/analytics/validation";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : "unknown";

    // Rate limit: max 120 analytics events per minute per IP
    const rl = await rateLimit(`analytics-event:${clientIp}`, { limit: 120, windowMs: 60_000 });
    if (!rl.success) {
      return new NextResponse(null, { status: 429 });
    }

    const raw = await request.json();
    const validation = validateAnalyticsPayload(raw);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const event = validation.data;

    if (hasDatabaseUrl()) {
      const { prisma } = await import("@/lib/db/prisma");
      await prisma.analyticsEvent.create({
        data: {
          eventName: event.eventName,
          category: event.category,
          path: event.path || null,
          contentType: event.contentType || null,
          contentSlug: event.contentSlug || null,
          anonymousSessionId: event.anonymousSessionId || null,
          metadata: event.metadata ? (event.metadata as Prisma.InputJsonValue) : undefined,
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    // Analytics failures must never return 500 to clients
    return new NextResponse(null, { status: 204 });
  }
}
