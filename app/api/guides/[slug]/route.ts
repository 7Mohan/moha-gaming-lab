/**
 * app/api/guides/[slug]/route.ts
 * ────────────────────────────────────────────────────────────────
 * REST endpoint: GET /api/guides/[slug]
 * Returns full technical guide content and related entities.
 */

import { NextResponse } from "next/server";
import { guideSlugParamSchema } from "@/lib/validation/guides";
import { getGuideBySlug } from "@/lib/services/guide-service";
import { getRelatedContentForGuide } from "@/lib/services/related-content-service";
import type { ApiResponseEnvelope } from "@/lib/validation/common";
import type { Guide } from "@/types/guide";
import type { Tool } from "@/types/tool";
import type { Game } from "@/types/game";
import type { App } from "@/types/app";

interface GuideDetailPayload {
  guide: Guide;
  related: {
    games: Game[];
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
    const parsed = guideSlugParamSchema.safeParse(rawParams);

    if (!parsed.success) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "INVALID_SLUG",
          message: "The requested guide slug is malformed",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { slug } = parsed.data;
    const guide = await getGuideBySlug(slug);

    if (!guide) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Guide with slug "${slug}" was not found`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const related = await getRelatedContentForGuide(slug);

    const response: ApiResponseEnvelope<GuideDetailPayload> = {
      success: true,
      data: {
        guide,
        related,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    const response: ApiResponseEnvelope<never> = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while fetching guide details",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
