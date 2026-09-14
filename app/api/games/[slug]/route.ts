/**
 * app/api/games/[slug]/route.ts
 * ────────────────────────────────────────────────────────────────
 * REST endpoint: GET /api/games/[slug]
 * Returns full game profile and related tools/guides.
 */

import { NextResponse } from "next/server";
import { gameSlugParamSchema } from "@/lib/validation/games";
import { getGameBySlug } from "@/lib/services/game-service";
import { getRelatedContentForGame } from "@/lib/services/related-content-service";
import type { ApiResponseEnvelope } from "@/lib/validation/common";
import type { Game } from "@/types/game";
import type { Tool } from "@/types/tool";
import type { App } from "@/types/app";
import type { Guide } from "@/types/guide";

interface GameDetailPayload {
  game: Game;
  related: {
    tools: Tool[];
    apps: App[];
    guides: Guide[];
  };
}

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const rawParams = await props.params;
    const parsed = gameSlugParamSchema.safeParse(rawParams);

    if (!parsed.success) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "INVALID_SLUG",
          message: "The requested game slug is malformed",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { slug } = parsed.data;
    const game = await getGameBySlug(slug);

    if (!game) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Game with slug "${slug}" was not found`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const related = await getRelatedContentForGame(slug);

    const response: ApiResponseEnvelope<GameDetailPayload> = {
      success: true,
      data: {
        game,
        related: {
          tools: related.tools,
          apps: related.apps,
          guides: related.guides,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    const response: ApiResponseEnvelope<never> = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while fetching game details",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
