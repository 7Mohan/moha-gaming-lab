import * as React from "react";
import { getAllGames } from "@/lib/services/game-service";
import { getAllGuides } from "@/lib/services/guide-service";
import { ToolForm } from "@/components/admin/tools/ToolForm";

export const dynamic = "force-dynamic";

export default async function NewToolPage() {
  const [allGames, allGuides] = await Promise.all([
    getAllGames(),
    getAllGuides(),
  ]);

  const availableGames = allGames.map((g) => ({
    id: g.id,
    title: g.name,
    slug: g.slug,
  }));

  const availableGuides = allGuides.map((g) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
  }));

  return (
    <ToolForm
      isNew
      availableGames={availableGames}
      availableGuides={availableGuides}
    />
  );
}
