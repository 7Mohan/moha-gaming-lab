import * as React from "react";
import { notFound } from "next/navigation";
import { getGameById, getGameBySlug } from "@/lib/services/game-service";
import { getAllTools } from "@/lib/services/tool-service";
import { getAllApps } from "@/lib/services/app-service";
import { getAllGuides } from "@/lib/services/guide-service";
import { getSession } from "@/lib/auth/session";
import { GameForm } from "@/components/admin/games/GameForm";

export const dynamic = "force-dynamic";

interface GameEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function GameEditPage({ params }: GameEditPageProps) {
  const { id } = await params;

  const [gameById, tools, apps, guides, session] = await Promise.all([
    getGameById(id),
    getAllTools(),
    getAllApps(),
    getAllGuides(),
    getSession(),
  ]);

  let game = gameById;
  if (!game) {
    game = await getGameBySlug(id);
  }

  if (!game) {
    notFound();
  }

  return (
    <GameForm
      initialData={game}
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
