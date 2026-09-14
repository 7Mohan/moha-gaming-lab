/**
 * app/api/apps/[slug]/route.ts
 * ────────────────────────────────────────────────────────────────
 * REST endpoint: GET /api/apps/[slug]
 * Returns full app profile, releases, and verified download metadata.
 */

import { NextResponse } from "next/server";
import { appSlugParamSchema } from "@/lib/validation/apps";
import { getAppBySlug, getAppReleases } from "@/lib/services/app-service";
import type { ApiResponseEnvelope } from "@/lib/validation/common";
import type { App, AppRelease } from "@/types/app";

interface AppDetailPayload {
  app: App;
  releases: AppRelease[];
}

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const rawParams = await props.params;
    const parsed = appSlugParamSchema.safeParse(rawParams);

    if (!parsed.success) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "INVALID_SLUG",
          message: "The requested app slug is malformed",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { slug } = parsed.data;
    const app = await getAppBySlug(slug);

    if (!app) {
      const response: ApiResponseEnvelope<never> = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `App with slug "${slug}" was not found`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const releases = await getAppReleases(slug);

    const response: ApiResponseEnvelope<AppDetailPayload> = {
      success: true,
      data: {
        app,
        releases,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    const response: ApiResponseEnvelope<never> = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while fetching app details",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
