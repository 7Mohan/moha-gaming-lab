import * as React from "react";
import { getAllGames } from "@/lib/services/game-service";
import { getAllGuides } from "@/lib/services/guide-service";
import { AppForm } from "@/components/admin/apps/AppForm";

export const dynamic = "force-dynamic";

export default async function NewAppPage() {
  const [games, guides] = await Promise.all([
    getAllGames(),
    getAllGuides(),
  ]);

  return (
    <AppForm
      isNew
      availableGames={games.map((g) => ({ id: g.id, title: g.name, slug: g.slug }))}
      availableGuides={guides.map((g) => ({ id: g.id, title: g.title, slug: g.slug }))}
    />
  );
}
