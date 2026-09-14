import * as React from "react";
import { getAllGames } from "@/lib/services/game-service";
import { getAllApps } from "@/lib/services/app-service";
import { getAllTools } from "@/lib/services/tool-service";
import { getAllGuides } from "@/lib/services/guide-service";
import { listRedirectRules } from "@/lib/seo/redirects";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { SeoManager, type SeoItem } from "@/components/admin/seo/SeoManager";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const [games, apps, tools, guides, redirects] = await Promise.all([
    getAllGames(),
    getAllApps(),
    getAllTools(),
    getAllGuides(),
    listRedirectRules(),
  ]);

  const items: SeoItem[] = [];

  games.forEach((g) =>
    items.push({
      id: g.id,
      type: "GAME",
      title: g.name,
      slug: g.slug,
      description: g.excerpt,
    })
  );

  apps.forEach((a) =>
    items.push({
      id: a.id,
      type: "APP",
      title: a.name,
      slug: a.slug,
      description: a.excerpt,
    })
  );

  tools.forEach((t) =>
    items.push({
      id: t.id,
      type: "TOOL",
      title: t.name,
      slug: t.slug,
      description: t.shortDescription,
    })
  );

  guides.forEach((g) =>
    items.push({
      id: g.id,
      type: "GUIDE",
      title: g.title,
      slug: g.slug,
      description: g.excerpt,
    })
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "SEO & Search Engine Indexing" }]} />
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          SEO & Meta Tags Architecture
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Tune OpenGraph previews, meta titles, descriptions, and crawler indexing rules across all resources.
        </p>
      </div>

      <SeoManager items={items} initialRedirects={redirects} />
    </div>
  );
}
