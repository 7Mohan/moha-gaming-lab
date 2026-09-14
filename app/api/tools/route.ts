/**
 * app/api/tools/route.ts
 * ────────────────────────────────────────────────────────────────
 * REST endpoint: GET /api/tools
 * Returns list of browser gaming diagnostics and performance tools.
 */

import { NextResponse } from "next/server";
import { toolQuerySchema } from "@/lib/validation/tools";
import { getPublishedTools } from "@/lib/services/tool-service";
import type { ApiResponseEnvelope } from "@/lib/validation/common";
import type { Tool } from "@/types/tool";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = toolQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

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
    const tools = await getPublishedTools({
      query: filters.q,
      category: filters.category,
      platform: filters.platform,
    });

    const response: ApiResponseEnvelope<Tool[]> = {
      success: true,
      data: tools,
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    const response: ApiResponseEnvelope<never> = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while fetching tools",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
