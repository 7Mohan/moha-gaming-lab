import { NextResponse } from "next/server";

/**
 * GET /api/health
 * ────────────────────────────────────────────────────────────────
 * Lightweight production health check endpoint.
 * Returns basic availability status without exposing any internal details,
 * credentials, environment variables, or infrastructure information.
 *
 * Used by:
 *  - Uptime monitoring services (UptimeRobot, BetterStack, etc.)
 *  - Load balancer liveness probes
 *  - CI/CD smoke test pipelines
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        // Health endpoints must NOT be cached — always reflect real-time status
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    }
  );
}

// Disable edge runtime — health check needs to confirm the Node.js layer is alive
export const runtime = "nodejs";
