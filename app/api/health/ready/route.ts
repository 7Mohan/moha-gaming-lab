import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/env";

/**
 * GET /api/health/ready
 * ────────────────────────────────────────────────────────────────
 * Production Readiness Probe Endpoint.
 *
 * Verifies that the application and its critical backing dependencies
 * (such as database connectivity) are ready to accept traffic.
 *
 * Used by:
 *  - Kubernetes readiness probes
 *  - Load balancer health targets before shifting traffic
 *  - Deployment smoke checks
 */
export async function GET() {
  const checks: Record<string, string> = {
    app: "ready",
  };

  let isReady = true;

  if (hasDatabaseUrl()) {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      // Fast lightweight ping query
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "connected";
    } catch {
      checks.database = "disconnected";
      isReady = false;
    }
  } else {
    checks.database = "in-memory";
  }

  const statusCode = isReady ? 200 : 503;

  return NextResponse.json(
    {
      status: isReady ? "ready" : "unready",
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
