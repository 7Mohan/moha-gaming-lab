import type { MetadataRoute } from "next";
import { games } from "@/data/games";
import { apps } from "@/data/apps";
import { tools } from "@/data/tools";
import { guides } from "@/data/guides";
import { SITE } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,               lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/games`,    lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/apps`,     lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/tools`,    lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/guides`,   lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/downloads`, lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/privacy`,   lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/android`,  lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`,    lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/contact`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  const gameRoutes: MetadataRoute.Sitemap = games.map((g) => ({
    url: `${base}/games/${g.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const appRoutes: MetadataRoute.Sitemap = apps.map((a) => ({
    url: `${base}/apps/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const toolRoutes: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${base}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const guideRoutes: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${base}/guides/${g.slug}`,
    lastModified: g.updatedAt ?? g.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...gameRoutes, ...appRoutes, ...toolRoutes, ...guideRoutes];
}
