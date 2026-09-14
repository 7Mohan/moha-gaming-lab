/**
 * app/api/tools/[slug]/route.ts
 * ────────────────────────────────────────────────────────────────
 * REST endpoint: GET /api/tools/[slug]
 * Returns tool definition, requirements, capabilities, and interpretation guide.
 */

import { NextResponse } from "next/server";
import { toolSlugParamSchema } from "@/lib/validation/tools";
import { getToolBySlug } from "@/lib/services/tool-service";
import type { ApiResponseEnvelope } from "@/lib/validation/common";
import type { Tool } from "@/types/tool";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const rawParams = await props.params;
    const parsed = toolSlugParamSchema.safeParse(rawParams);

    if (!parsed.success) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "INVALID_SLUG",
          message: "The requested tool slug is malformed",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { slug } = parsed.data;
    const tool = await getToolBySlug(slug);

    if (!tool) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Tool with slug "${slug}" was not found`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponseEnvelope<Tool> = {
      success: true,
      data: tool,
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    const response: ApiResponseEnvelope<never> = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while fetching tool details",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
