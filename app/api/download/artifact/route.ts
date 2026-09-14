/**
 * app/api/download/artifact/route.ts
 * ────────────────────────────────────────────────────────────────
 * In-memory test/dev download fallback route for mock storage objects.
 */

import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const expires = searchParams.get("expires");

  if (!path) {
    return NextResponse.json({ error: "Missing artifact path" }, { status: 400 });
  }

  if (expires && Date.now() > parseInt(expires, 10)) {
    return NextResponse.json({ error: "Download link has expired" }, { status: 410 });
  }

  const storage = getStorageProvider();
  const exists = await storage.exists(path);

  if (!exists) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const metadata = await storage.getMetadata(path);
  const fileName = metadata?.name || path.split("/").pop() || "release.apk";

  return new NextResponse(`Mock artifact content for ${path}`, {
    headers: {
      "Content-Type": metadata?.mimeType || "application/vnd.android.package-archive",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
