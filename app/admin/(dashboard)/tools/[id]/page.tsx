import * as React from "react";
import { notFound } from "next/navigation";
import { getToolById, getToolBySlug } from "@/lib/services/tool-service";
import { getAllGames } from "@/lib/services/game-service";
import { getAllGuides } from "@/lib/services/guide-service";
import { ToolForm } from "@/components/admin/tools/ToolForm";

export const dynamic = "force-dynamic";

interface ToolEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ToolEditPage({ params }: ToolEditPageProps) {
  const { id } = await params;

  let tool = await getToolById(id);
  if (!tool) {
    tool = await getToolBySlug(id);
  }

  if (!tool) {
    notFound();
  }

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
      initialData={tool}
      availableGames={availableGames}
      availableGuides={availableGuides}
    />
  );
}
