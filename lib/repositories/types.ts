/**
 * lib/repositories/types.ts
 * ────────────────────────────────────────────────────────────────
 * Typed repository interfaces decoupling application services from
 * database implementation details.
 */

import type { Game, GameCategory, PerformanceArea, Platform } from "@/types/game";
import type { App, AppRelease } from "@/types/app";
import type { Tool } from "@/types/tool";
import type { Guide } from "@/types/guide";

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GameFilterOptions extends PaginationOptions {
  query?: string;
  category?: GameCategory | "all";
  platform?: Platform | "all";
  performanceArea?: PerformanceArea | "all";
  status?: string;
}

export interface AppFilterOptions extends PaginationOptions {
  query?: string;
  category?: string;
  requiresRoot?: boolean;
  verificationStatus?: string;
  status?: string;
}

export interface ToolFilterOptions {
  query?: string;
  category?: string;
  platform?: string;
  status?: string;
}

export interface GuideFilterOptions extends PaginationOptions {
  query?: string;
  category?: string;
  difficulty?: string;
  contentType?: string;
  tag?: string;
  status?: string;
}

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  sectionType: "GAME" | "APP" | "TOOL" | "GUIDE";
}

export interface TagRecord {
  id: string;
  slug: string;
  name: string;
}

/* ── Repository Interfaces ─────────────────────────────────── */

export interface IGameRepository {
  getById(id: string): Promise<Game | null>;
  getBySlug(slug: string): Promise<Game | null>;
  listPublished(filters?: GameFilterOptions): Promise<PaginatedResult<Game>>;
  listAll(filters?: GameFilterOptions): Promise<Game[]>;
  count(): Promise<number>;
  create(data: Game): Promise<Game>;
  update(id: string, data: Partial<Game>): Promise<Game>;
  delete(id: string): Promise<boolean>;
  setStatus(id: string, status: string): Promise<Game>;
}

export interface IAppRepository {
  getById(id: string): Promise<App | null>;
  getBySlug(slug: string): Promise<App | null>;
  listPublished(filters?: AppFilterOptions): Promise<PaginatedResult<App>>;
  listAll(filters?: AppFilterOptions): Promise<App[]>;
  getLatestRelease(appSlug: string): Promise<AppRelease | null>;
  listReleases(appSlug: string): Promise<AppRelease[]>;
  count(): Promise<number>;
  create(data: App): Promise<App>;
  update(id: string, data: Partial<App>): Promise<App>;
  delete(id: string): Promise<boolean>;
  createRelease(appSlug: string, release: AppRelease): Promise<AppRelease>;
  updateRelease(appSlug: string, releaseId: string, release: Partial<AppRelease>): Promise<AppRelease>;
  deleteRelease(appSlug: string, releaseId: string): Promise<boolean>;
  setStatus(id: string, status: string): Promise<App>;
}

export interface IToolRepository {
  getById(id: string): Promise<Tool | null>;
  getBySlug(slug: string): Promise<Tool | null>;
  listPublished(filters?: ToolFilterOptions): Promise<Tool[]>;
  listAll(): Promise<Tool[]>;
  count(): Promise<number>;
  create(data: Tool): Promise<Tool>;
  update(id: string, data: Partial<Tool>): Promise<Tool>;
  delete(id: string): Promise<boolean>;
  setStatus(id: string, status: string): Promise<Tool>;
}

export interface IGuideRepository {
  getById(id: string): Promise<Guide | null>;
  getBySlug(slug: string): Promise<Guide | null>;
  listPublished(filters?: GuideFilterOptions): Promise<PaginatedResult<Guide>>;
  listAll(filters?: GuideFilterOptions): Promise<Guide[]>;
  count(): Promise<number>;
  create(data: Guide): Promise<Guide>;
  update(id: string, data: Partial<Guide>): Promise<Guide>;
  delete(id: string): Promise<boolean>;
  setStatus(id: string, status: string): Promise<Guide>;
}

export interface ICategoryRepository {
  listAll(sectionType?: "GAME" | "APP" | "TOOL" | "GUIDE"): Promise<CategoryRecord[]>;
  getBySlug(slug: string): Promise<CategoryRecord | null>;
  create(data: { name: string; slug: string; sectionType: "GAME" | "APP" | "TOOL" | "GUIDE" }): Promise<CategoryRecord>;
  update(id: string, data: { name?: string; slug?: string }): Promise<CategoryRecord>;
  delete(id: string): Promise<boolean>;
}

export interface ITagRepository {
  listAll(): Promise<TagRecord[]>;
  getBySlug(slug: string): Promise<TagRecord | null>;
  create(data: { name: string; slug: string }): Promise<TagRecord>;
  rename(id: string, name: string): Promise<TagRecord>;
  delete(id: string): Promise<boolean>;
}

