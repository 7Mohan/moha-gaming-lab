/**
 * app/api/search/route.ts
 * ────────────────────────────────────────────────────────────────
 * REST endpoint: GET /api/search
 * Global search across Games, Tools, Apps, and Guides.
 */

import { NextResponse } from "next/server";
import { searchQuerySchema } from "@/lib/validation/search";
import { globalSearch } from "@/lib/search";
import type { ApiResponseEnvelope } from "@/lib/validation/common";
import type { SearchResults } from "@/types/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = searchQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "INVALID_PARAMETERS",
          message: "One or more search parameters are invalid",
          details: parsed.error.flatten().fieldErrors,
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { q, limit, section, sort, game } = parsed.data;
    const rawResults = globalSearch(q, limit);

    // Filter by section if requested
    let results = rawResults;
    if (section !== "all") {
      results = {
        ...rawResults,
        all:
          section === "game"
            ? rawResults.games
            : section === "tool"
            ? rawResults.tools
            : section === "app"
            ? rawResults.apps
            : rawResults.guides,
      };
    }

    // Filter by game if provided
    if (game) {
      const gSlug = game.toLowerCase();
      const filterGame = <T extends { type: string; slug: string; relatedGameSlugs?: string[] }>(
        items: T[]
      ) =>
        items.filter((i) =>
          i.type === "game" ? i.slug === gSlug : i.relatedGameSlugs?.includes(gSlug)
        );

      results = {
        ...results,
        games: filterGame(results.games),
        tools: filterGame(results.tools),
        apps: filterGame(results.apps),
        guides: filterGame(results.guides),
        all: filterGame(results.all),
      };
    }

    // Sort if alphabetical
    if (sort === "alphabetical") {
      results = {
        ...results,
        all: [...results.all].sort((a, b) => a.title.localeCompare(b.title)),
      };
    }

    const response: ApiResponseEnvelope<SearchResults> = {
      success: true,
      data: results,
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    const response: ApiResponseEnvelope<never> = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during search",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
