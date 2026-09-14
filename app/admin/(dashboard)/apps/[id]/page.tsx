import * as React from "react";
import { notFound } from "next/navigation";
import { getAppById, getAppBySlug } from "@/lib/services/app-service";
import { getAllGames } from "@/lib/services/game-service";
import { getAllGuides } from "@/lib/services/guide-service";
import { AppForm } from "@/components/admin/apps/AppForm";

export const dynamic = "force-dynamic";

interface AppEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AppEditPage({ params }: AppEditPageProps) {
  const { id } = await params;

  let app = await getAppById(id);
  if (!app) {
    app = await getAppBySlug(id);
  }

  if (!app) {
    notFound();
  }

  const [games, guides] = await Promise.all([
    getAllGames(),
    getAllGuides(),
  ]);

  return (
    <AppForm
      initialData={app}
      availableGames={games.map((g) => ({ id: g.id, title: g.name, slug: g.slug }))}
      availableGuides={guides.map((g) => ({ id: g.id, title: g.title, slug: g.slug }))}
    />
  );
}
