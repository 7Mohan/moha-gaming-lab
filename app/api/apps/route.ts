/**
 * app/api/apps/route.ts
 * ────────────────────────────────────────────────────────────────
 * REST endpoint: GET /api/apps
 * Returns paginated, filtered list of published Android applications.
 */

import { NextResponse } from "next/server";
import { appQuerySchema } from "@/lib/validation/apps";
import { getPublishedApps } from "@/lib/services/app-service";
import type { ApiResponseEnvelope } from "@/lib/validation/common";
import type { App } from "@/types/app";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = appQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "INVALID_PARAMETERS",
          message: "One or more query parameters are invalid",
          details: parsed.error.flatten().fieldErrors,
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const filters = parsed.data;
    const result = await getPublishedApps({
      page: filters.page,
      limit: filters.limit,
      query: filters.q,
      category: filters.category,
      requiresRoot: filters.root,
      verificationStatus: filters.verificationStatus,
    });

    const response: ApiResponseEnvelope<App[]> = {
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    const response: ApiResponseEnvelope<never> = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while fetching apps",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
