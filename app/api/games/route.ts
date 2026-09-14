/**
 * app/api/games/route.ts
 * ────────────────────────────────────────────────────────────────
 * REST endpoint: GET /api/games
 * Returns paginated, filtered list of published games.
 */

import { NextResponse } from "next/server";
import { gameQuerySchema } from "@/lib/validation/games";
import { getPublishedGames } from "@/lib/services/game-service";
import type { ApiResponseEnvelope } from "@/lib/validation/common";
import type { Game } from "@/types/game";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = gameQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

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
    const result = await getPublishedGames({
      page: filters.page,
      limit: filters.limit,
      query: filters.q,
      category: filters.category,
      platform: filters.platform,
      performanceArea: filters.performanceArea,
    });

    const response: ApiResponseEnvelope<Game[]> = {
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
        message: "An unexpected error occurred while fetching games",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
