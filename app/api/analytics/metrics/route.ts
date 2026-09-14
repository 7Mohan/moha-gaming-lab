/**
 * app/api/analytics/metrics/route.ts
 * ────────────────────────────────────────────────────────────────
 * Authenticated Admin API endpoint for real growth & analytics metrics.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getAnalyticsSummary } from "@/lib/analytics/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || !can(session.role, "read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metrics = await getAnalyticsSummary();
  return NextResponse.json(metrics);
}
