import * as React from "react";
import { getAllTools } from "@/lib/services/tool-service";
import { getAllApps } from "@/lib/services/app-service";
import { getAllGuides } from "@/lib/services/guide-service";
import { getSession } from "@/lib/auth/session";
import { GameForm } from "@/components/admin/games/GameForm";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const [tools, apps, guides, session] = await Promise.all([
    getAllTools(),
    getAllApps(),
    getAllGuides(),
    getSession(),
  ]);

  return (
    <GameForm
      isNew
      userRole={session?.role || "ADMIN"}
      availableTools={tools.map((t) => ({
        slug: t.slug,
        title: t.name,
        subtitle: t.shortDescription,
        badge: t.category,
      }))}
      availableApps={apps.map((a) => ({
        slug: a.slug,
        title: a.name,
        subtitle: a.developer,
        badge: a.category,
      }))}
      availableGuides={guides.map((g) => ({
        slug: g.slug,
        title: g.title,
        subtitle: g.category,
        badge: g.difficulty,
      }))}
    />
  );
}
