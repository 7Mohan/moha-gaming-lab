/**
 * lib/repositories/static-repository.ts
 * ────────────────────────────────────────────────────────────────
 * High-performance repository implementations backed by typed data files
 * with in-memory mutable runtime state for development and testing.
 * Guarantees zero-latency local development, offline builds, and CI stability.
 */

import { games as GAMES, getGameBySlug as getStaticGame } from "@/data/games";
import { apps as APPS, getAppBySlug as getStaticApp } from "@/data/apps";
import { tools as TOOLS, getToolBySlug as getStaticTool } from "@/data/tools";
import { guides as GUIDES, getGuideBySlug as getStaticGuide } from "@/data/guides";
import { compareReleasesDesc } from "@/lib/download/versions";

import {
  registerGameForSearch,
  registerAppForSearch,
  registerToolForSearch,
  registerGuideForSearch,
} from "@/lib/search-index";

import type { Game, PerformanceArea } from "@/types/game";
import type { App, AppRelease } from "@/types/app";
import type { Tool } from "@/types/tool";
import type { Guide } from "@/types/guide";

import type {
  IGameRepository,
  IAppRepository,
  IToolRepository,
  IGuideRepository,
  ICategoryRepository,
  ITagRepository,
  GameFilterOptions,
  AppFilterOptions,
  ToolFilterOptions,
  GuideFilterOptions,
  PaginatedResult,
  CategoryRecord,
  TagRecord,
} from "./types";

// In-memory runtime stores for development and admin mutations
let runtimeGames: Game[] = [...GAMES];
let runtimeApps: App[] = [...APPS];
let runtimeTools: Tool[] = [...TOOLS];
let runtimeGuides: Guide[] = [...GUIDES];
let runtimeCategories: CategoryRecord[] | null = null;
let runtimeTags: TagRecord[] | null = null;

/* ── Games Repository ────────────────────────────────────────── */

export class StaticGameRepository implements IGameRepository {
  async getById(id: string): Promise<Game | null> {
    return runtimeGames.find((g) => g.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Game | null> {
    return runtimeGames.find((g) => g.slug === slug) ?? getStaticGame(slug) ?? null;
  }

  async listPublished(filters: GameFilterOptions = {}): Promise<PaginatedResult<Game>> {
    let items = runtimeGames.filter((g) => g.status === "active");

    if (filters.category && filters.category !== "all") {
      items = items.filter((g) => g.category === filters.category);
    }
    if (filters.platform && filters.platform !== "all") {
      items = items.filter((g) => g.platform === filters.platform);
    }
    if (filters.performanceArea && filters.performanceArea !== "all") {
      const area = filters.performanceArea as PerformanceArea;
      items = items.filter((g) => g.performanceAreas.includes(area));
    }
    if (filters.query?.trim()) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.excerpt.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async listAll(filters?: GameFilterOptions): Promise<Game[]> {
    let items = [...runtimeGames];
    if (filters?.status && filters.status !== "all") {
      items = items.filter((g) => g.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.query?.trim()) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.excerpt.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return items;
  }

  async count(): Promise<number> {
    return runtimeGames.length;
  }

  async create(data: Game): Promise<Game> {
    const existingIndex = runtimeGames.findIndex((g) => g.id === data.id || g.slug === data.slug);
    if (existingIndex >= 0) {
      runtimeGames[existingIndex] = { ...data };
      registerGameForSearch(runtimeGames[existingIndex]!);
      return data;
    }
    runtimeGames.unshift(data);
    registerGameForSearch(data);
    return data;
  }

  async update(id: string, data: Partial<Game>): Promise<Game> {
    const index = runtimeGames.findIndex((g) => g.id === id || g.slug === id);
    if (index < 0) {
      throw new Error(`Game not found: ${id}`);
    }
    runtimeGames[index] = {
      ...runtimeGames[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    registerGameForSearch(runtimeGames[index]!);
    return runtimeGames[index]!;
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = runtimeGames.length;
    runtimeGames = runtimeGames.filter((g) => g.id !== id && g.slug !== id);
    return runtimeGames.length < initialLen;
  }

  async setStatus(id: string, status: string): Promise<Game> {
    return this.update(id, { status: status as Game["status"] });
  }
}

/* ── Apps Repository ─────────────────────────────────────────── */

export class StaticAppRepository implements IAppRepository {
  async getById(id: string): Promise<App | null> {
    return runtimeApps.find((a) => a.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<App | null> {
    return runtimeApps.find((a) => a.slug === slug) ?? getStaticApp(slug) ?? null;
  }

  async listPublished(filters: AppFilterOptions = {}): Promise<PaginatedResult<App>> {
    let items = runtimeApps.filter((a) => a.status === "active" || a.status === "stable");

    if (filters.category && filters.category !== "all") {
      items = items.filter((a) => a.category === filters.category);
    }
    if (typeof filters.requiresRoot === "boolean") {
      items = items.filter((a) => a.requiresRoot === filters.requiresRoot);
    }
    if (filters.verificationStatus) {
      items = items.filter((a) =>
        a.releases.some((r) => r.verificationStatus === filters.verificationStatus)
      );
    }
    if (filters.query?.trim()) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async listAll(filters?: AppFilterOptions): Promise<App[]> {
    let items = [...runtimeApps];
    if (filters?.status && filters.status !== "all") {
      items = items.filter((a) => a.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.query?.trim()) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return items;
  }

  async getLatestRelease(appSlug: string): Promise<AppRelease | null> {
    const app = await this.getBySlug(appSlug);
    if (!app || !app.releases) return null;
    const published = app.releases.filter((r) => !r.status || r.status.toLowerCase() === "published");
    if (published.length === 0) return null;
    const sorted = [...published].sort(compareReleasesDesc);
    return sorted[0] ?? null;
  }

  async listReleases(appSlug: string): Promise<AppRelease[]> {
    const app = await this.getBySlug(appSlug);
    if (!app) return [];
    return [...app.releases].sort(compareReleasesDesc);
  }

  async count(): Promise<number> {
    return runtimeApps.length;
  }

  async create(data: App): Promise<App> {
    const existingIndex = runtimeApps.findIndex((a) => a.id === data.id || a.slug === data.slug);
    if (existingIndex >= 0) {
      runtimeApps[existingIndex] = { ...data };
      registerAppForSearch(runtimeApps[existingIndex]!);
      return data;
    }
    runtimeApps.unshift(data);
    registerAppForSearch(data);
    return data;
  }

  async update(id: string, data: Partial<App>): Promise<App> {
    const index = runtimeApps.findIndex((a) => a.id === id || a.slug === id);
    if (index < 0) {
      throw new Error(`App not found: ${id}`);
    }
    runtimeApps[index] = {
      ...runtimeApps[index]!,
      ...data,
    };
    registerAppForSearch(runtimeApps[index]!);
    return runtimeApps[index]!;
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = runtimeApps.length;
    runtimeApps = runtimeApps.filter((a) => a.id !== id && a.slug !== id);
    return runtimeApps.length < initialLen;
  }

  async createRelease(appSlug: string, release: AppRelease): Promise<AppRelease> {
    const app = await this.getBySlug(appSlug);
    if (!app) throw new Error(`App not found: ${appSlug}`);
    app.releases.unshift(release);
    app.releases.sort(compareReleasesDesc);
    registerAppForSearch(app);
    return release;
  }

  async updateRelease(
    appSlug: string,
    releaseId: string,
    release: Partial<AppRelease>
  ): Promise<AppRelease> {
    const app = await this.getBySlug(appSlug);
    if (!app) throw new Error(`App not found: ${appSlug}`);
    const relIndex = app.releases.findIndex((r) => r.version === releaseId);
    if (relIndex < 0) throw new Error(`Release not found: ${releaseId}`);
    app.releases[relIndex] = { ...app.releases[relIndex]!, ...release };
    registerAppForSearch(app);
    return app.releases[relIndex]!;
  }

  async deleteRelease(appSlug: string, releaseId: string): Promise<boolean> {
    const app = await this.getBySlug(appSlug);
    if (!app) return false;
    const initialLen = app.releases.length;
    app.releases = app.releases.filter((r) => r.version !== releaseId);
    return app.releases.length < initialLen;
  }

  async setStatus(id: string, status: string): Promise<App> {
    return this.update(id, { status: status as App["status"] });
  }
}

/* ── Tools Repository ────────────────────────────────────────── */

export class StaticToolRepository implements IToolRepository {
  async getById(id: string): Promise<Tool | null> {
    return runtimeTools.find((t) => t.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Tool | null> {
    return runtimeTools.find((t) => t.slug === slug) ?? getStaticTool(slug) ?? null;
  }

  async listPublished(filters: ToolFilterOptions = {}): Promise<Tool[]> {
    let items = runtimeTools.filter((t) => t.status === "available" || t.status === "beta");

    if (filters.category && filters.category !== "all") {
      items = items.filter((t) => t.category === filters.category);
    }
    if (filters.platform && filters.platform !== "all") {
      items = items.filter((t) =>
        t.platforms.includes(filters.platform as "web" | "android" | "windows")
      );
    }
    if (filters.query?.trim()) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.shortDescription.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return items;
  }

  async listAll(): Promise<Tool[]> {
    return [...runtimeTools];
  }

  async count(): Promise<number> {
    return runtimeTools.length;
  }

  async create(data: Tool): Promise<Tool> {
    const existingIndex = runtimeTools.findIndex((t) => t.id === data.id || t.slug === data.slug);
    if (existingIndex >= 0) {
      runtimeTools[existingIndex] = { ...data };
      registerToolForSearch(runtimeTools[existingIndex]!);
      return data;
    }
    runtimeTools.unshift(data);
    registerToolForSearch(data);
    return data;
  }

  async update(id: string, data: Partial<Tool>): Promise<Tool> {
    const index = runtimeTools.findIndex((t) => t.id === id || t.slug === id);
    if (index < 0) {
      throw new Error(`Tool not found: ${id}`);
    }
    runtimeTools[index] = {
      ...runtimeTools[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    registerToolForSearch(runtimeTools[index]!);
    return runtimeTools[index]!;
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = runtimeTools.length;
    runtimeTools = runtimeTools.filter((t) => t.id !== id && t.slug !== id);
    return runtimeTools.length < initialLen;
  }

  async setStatus(id: string, status: string): Promise<Tool> {
    return this.update(id, { status: status as Tool["status"] });
  }
}

/* ── Guides Repository ───────────────────────────────────────── */

export class StaticGuideRepository implements IGuideRepository {
  async getById(id: string): Promise<Guide | null> {
    return runtimeGuides.find((g) => g.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Guide | null> {
    return runtimeGuides.find((g) => g.slug === slug) ?? getStaticGuide(slug) ?? null;
  }

  async listPublished(filters: GuideFilterOptions = {}): Promise<PaginatedResult<Guide>> {
    let items = runtimeGuides.filter((g) => g.status === "published");

    if (filters.category && filters.category !== "all") {
      items = items.filter((g) => g.category === filters.category);
    }
    if (filters.difficulty && filters.difficulty !== "all") {
      items = items.filter((g) => g.difficulty === filters.difficulty);
    }
    if (filters.contentType && filters.contentType !== "all") {
      items = items.filter((g) => g.contentType === filters.contentType);
    }
    if (filters.tag) {
      items = items.filter((g) => g.tags.includes(filters.tag!));
    }
    if (filters.query?.trim()) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.excerpt.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async listAll(filters?: GuideFilterOptions): Promise<Guide[]> {
    let items = [...runtimeGuides];
    if (filters?.status && filters.status !== "all") {
      items = items.filter((g) => g.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.query?.trim()) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.excerpt.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return items;
  }

  async count(): Promise<number> {
    return runtimeGuides.length;
  }

  async create(data: Guide): Promise<Guide> {
    const existingIndex = runtimeGuides.findIndex((g) => g.id === data.id || g.slug === data.slug);
    if (existingIndex >= 0) {
      runtimeGuides[existingIndex] = { ...data };
      registerGuideForSearch(runtimeGuides[existingIndex]!);
      return data;
    }
    runtimeGuides.unshift(data);
    registerGuideForSearch(data);
    return data;
  }

  async update(id: string, data: Partial<Guide>): Promise<Guide> {
    const index = runtimeGuides.findIndex((g) => g.id === id || g.slug === id);
    if (index < 0) {
      throw new Error(`Guide not found: ${id}`);
    }
    runtimeGuides[index] = {
      ...runtimeGuides[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    registerGuideForSearch(runtimeGuides[index]!);
    return runtimeGuides[index]!;
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = runtimeGuides.length;
    runtimeGuides = runtimeGuides.filter((g) => g.id !== id && g.slug !== id);
    return runtimeGuides.length < initialLen;
  }

  async setStatus(id: string, status: string): Promise<Guide> {
    return this.update(id, { status: status as Guide["status"] });
  }
}

/* ── Category & Tag Repositories ─────────────────────────────── */

export class StaticCategoryRepository implements ICategoryRepository {
  private initCategories(): CategoryRecord[] {
    const list: CategoryRecord[] = [];

    const gameCats = Array.from(new Set(GAMES.map((g) => g.category)));
    gameCats.forEach((c) =>
      list.push({
        id: `cat-game-${c}`,
        slug: c,
        name: c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        sectionType: "GAME",
      })
    );

    const appCats = Array.from(new Set(APPS.map((a) => a.category)));
    appCats.forEach((c) =>
      list.push({
        id: `cat-app-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        slug: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: c,
        sectionType: "APP",
      })
    );

    const toolCats = Array.from(new Set(TOOLS.map((t) => t.category)));
    toolCats.forEach((c) =>
      list.push({
        id: `cat-tool-${c}`,
        slug: c,
        name: c.charAt(0).toUpperCase() + c.slice(1),
        sectionType: "TOOL",
      })
    );

    const guideCats = Array.from(new Set(GUIDES.map((g) => g.category)));
    guideCats.forEach((c) =>
      list.push({
        id: `cat-guide-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        slug: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: c,
        sectionType: "GUIDE",
      })
    );

    return list;
  }

  async listAll(sectionType?: "GAME" | "APP" | "TOOL" | "GUIDE"): Promise<CategoryRecord[]> {
    if (!runtimeCategories) {
      runtimeCategories = this.initCategories();
    }
    if (!sectionType) return [...runtimeCategories];
    return runtimeCategories.filter((c) => c.sectionType === sectionType);
  }

  async getBySlug(slug: string): Promise<CategoryRecord | null> {
    const all = await this.listAll();
    return all.find((c) => c.slug === slug) ?? null;
  }

  async create(data: {
    name: string;
    slug: string;
    sectionType: "GAME" | "APP" | "TOOL" | "GUIDE";
  }): Promise<CategoryRecord> {
    if (!runtimeCategories) {
      runtimeCategories = this.initCategories();
    }
    const cat: CategoryRecord = {
      id: `cat-${data.sectionType.toLowerCase()}-${data.slug}`,
      ...data,
    };
    runtimeCategories.push(cat);
    return cat;
  }

  async update(id: string, data: { name?: string; slug?: string }): Promise<CategoryRecord> {
    if (!runtimeCategories) {
      runtimeCategories = this.initCategories();
    }
    const index = runtimeCategories.findIndex((c) => c.id === id || c.slug === id);
    if (index < 0) throw new Error(`Category not found: ${id}`);
    runtimeCategories[index] = { ...runtimeCategories[index]!, ...data };
    return runtimeCategories[index]!;
  }

  async delete(id: string): Promise<boolean> {
    if (!runtimeCategories) {
      runtimeCategories = this.initCategories();
    }
    const initialLen = runtimeCategories.length;
    runtimeCategories = runtimeCategories.filter((c) => c.id !== id && c.slug !== id);
    return runtimeCategories.length < initialLen;
  }
}

export class StaticTagRepository implements ITagRepository {
  private initTags(): TagRecord[] {
    const tags = new Set<string>();
    GAMES.forEach((g) => g.tags.forEach((t) => tags.add(t)));
    APPS.forEach((a) => a.tags.forEach((t) => tags.add(t)));
    TOOLS.forEach((t) => t.tags.forEach((tag) => tags.add(tag)));
    GUIDES.forEach((g) => g.tags.forEach((t) => tags.add(t)));

    return Array.from(tags).map((slug) => ({
      id: `tag-${slug}`,
      slug,
      name: slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    }));
  }

  async listAll(): Promise<TagRecord[]> {
    if (!runtimeTags) {
      runtimeTags = this.initTags();
    }
    return [...runtimeTags];
  }

  async getBySlug(slug: string): Promise<TagRecord | null> {
    const all = await this.listAll();
    return all.find((t) => t.slug === slug) ?? null;
  }

  async create(data: { name: string; slug: string }): Promise<TagRecord> {
    if (!runtimeTags) {
      runtimeTags = this.initTags();
    }
    const record: TagRecord = {
      id: `tag-${data.slug}`,
      ...data,
    };
    runtimeTags.push(record);
    return record;
  }

  async rename(id: string, name: string): Promise<TagRecord> {
    if (!runtimeTags) {
      runtimeTags = this.initTags();
    }
    const index = runtimeTags.findIndex((t) => t.id === id || t.slug === id);
    if (index < 0) throw new Error(`Tag not found: ${id}`);
    runtimeTags[index] = { ...runtimeTags[index]!, name };
    return runtimeTags[index]!;
  }

  async delete(id: string): Promise<boolean> {
    if (!runtimeTags) {
      runtimeTags = this.initTags();
    }
    const initialLen = runtimeTags.length;
    runtimeTags = runtimeTags.filter((t) => t.id !== id && t.slug !== id);
    return runtimeTags.length < initialLen;
  }
}
