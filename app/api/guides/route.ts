/**
 * app/api/guides/route.ts
 * ────────────────────────────────────────────────────────────────
 * REST endpoint: GET /api/guides
 * Returns paginated, filtered list of published technical guides and tutorials.
 */

import { NextResponse } from "next/server";
import { guideQuerySchema } from "@/lib/validation/guides";
import { getPublishedGuides } from "@/lib/services/guide-service";
import type { ApiResponseEnvelope } from "@/lib/validation/common";
import type { Guide } from "@/types/guide";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = guideQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

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
    const result = await getPublishedGuides({
      page: filters.page,
      limit: filters.limit,
      query: filters.q,
      category: filters.category,
      difficulty: filters.difficulty,
      contentType: filters.contentType,
      tag: filters.tag,
    });

    const response: ApiResponseEnvelope<Guide[]> = {
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
        message: "An unexpected error occurred while fetching guides",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
