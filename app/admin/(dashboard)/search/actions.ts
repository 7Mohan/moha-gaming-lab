"use server";

import { globalSearch } from "@/lib/search";
import { getSearchStore } from "@/lib/search-index";

export interface AdminSearchResultItem {
  type: "game" | "tool" | "app" | "guide";
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  status: string;
  editHref: string;
  publicHref: string;
  tags: string[];
}

export async function adminSearchAction(query: string): Promise<AdminSearchResultItem[]> {
  const q = query?.trim() || "";
  if (!q) return [];

  const results = globalSearch(q, { limit: 25, includeDrafts: true });
  const store = getSearchStore();

  const gameMap = new Map(store.games.map((g) => [g.slug, g]));
  const appMap = new Map(store.apps.map((a) => [a.slug, a]));
  const toolMap = new Map(store.tools.map((t) => [t.slug, t]));
  const guideMap = new Map(store.guides.map((gu) => [gu.slug, gu]));

  return results.all.map((res) => {
    let status = "published";
    let editHref = "";

    switch (res.type) {
      case "game": {
        const g = gameMap.get(res.slug);
        status = g?.status || "active";
        editHref = `/admin/games/${g?.id || res.slug}`;
        break;
      }
      case "app": {
        const a = appMap.get(res.slug);
        status = a?.status || "active";
        editHref = `/admin/apps/${a?.id || res.slug}`;
        break;
      }
      case "tool": {
        const t = toolMap.get(res.slug);
        status = t?.status || "available";
        editHref = `/admin/tools/${t?.id || res.slug}`;
        break;
      }
      case "guide": {
        const gu = guideMap.get(res.slug);
        status = gu?.status || "published";
        editHref = `/admin/guides/${gu?.id || res.slug}`;
        break;
      }
    }

    return {
      type: res.type,
      id: res.id,
      slug: res.slug,
      title: res.title,
      subtitle: res.subtitle,
      excerpt: res.excerpt,
      category: res.category || "",
      status,
      editHref,
      publicHref: res.href,
      tags: res.tags,
    };
  });
}
