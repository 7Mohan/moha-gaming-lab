/**
 * lib/repositories/prisma-repository.ts
 * ────────────────────────────────────────────────────────────────
 * Production PostgreSQL repository implementations using Prisma Client.
 */

import { prisma } from "../db/prisma";
import type { Game, GameCategory, PerformanceArea, Platform } from "@/types/game";
import type { App, AppRelease, AppArchitecture, VerificationStatus } from "@/types/app";
import type { Tool, ToolCategory, ToolPlatform, ToolStatus } from "@/types/tool";
import type { Guide, GuideCategory, GuideContentType, GuideDifficulty } from "@/types/guide";
import { compareReleasesDesc } from "@/lib/download/versions";

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

/* ── Prisma Games Repository ─────────────────────────────────── */

export class PrismaGameRepository implements IGameRepository {
  async getById(id: string): Promise<Game | null> {
    try {
      const record = await prisma.game.findUnique({ where: { id } });
      return record ? this.mapGame(record) : null;
    } catch {
      return null;
    }
  }

  async getBySlug(slug: string): Promise<Game | null> {
    try {
      const record = await prisma.game.findUnique({ where: { slug } });
      return record ? this.mapGame(record) : null;
    } catch {
      return null;
    }
  }

  async listPublished(filters: GameFilterOptions = {}): Promise<PaginatedResult<Game>> {
    try {
      const where: Record<string, unknown> = {
        status: "PUBLISHED",
      };

      if (filters.category && filters.category !== "all") {
        where.genres = { has: filters.category };
      }
      if (filters.performanceArea && filters.performanceArea !== "all") {
        where.performanceAreas = { has: filters.performanceArea };
      }
      if (filters.query?.trim()) {
        where.OR = [
          { name: { contains: filters.query.trim(), mode: "insensitive" } },
          { excerpt: { contains: filters.query.trim(), mode: "insensitive" } },
        ];
      }

      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        prisma.game.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
        }),
        prisma.game.count({ where }),
      ]);

      return {
        items: records.map((r) => this.mapGame(r)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch {
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };
    }
  }

  async listAll(): Promise<Game[]> {
    try {
      const records = await prisma.game.findMany({ orderBy: { name: "asc" } });
      return records.map((r) => this.mapGame(r));
    } catch {
      return [];
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.game.count();
    } catch {
      return 0;
    }
  }

  async create(data: Game): Promise<Game> {
    const record = await prisma.game.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        excerpt: data.excerpt,
        description: data.description,
        genres: data.tags || [data.category],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        platform: (data.platform?.toUpperCase() || "ANDROID") as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        performanceAreas: data.performanceAreas as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deviceTier: (data.deviceTier?.toUpperCase() || "MID") as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recommendations: data.optimizationRecs as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        commonProblems: data.commonProblems as any,
        icon: data.iconUrl || undefined,
        status: data.status === "active" ? "PUBLISHED" : "DRAFT",
      },
    });
    return this.mapGame(record);
  }

  async update(id: string, data: Partial<Game>): Promise<Game> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.genres = data.tags;
    if (data.platform !== undefined) updateData.platform = data.platform.toUpperCase();
    if (data.performanceAreas !== undefined) updateData.performanceAreas = data.performanceAreas;
    if (data.deviceTier !== undefined) updateData.deviceTier = data.deviceTier.toUpperCase();
    if (data.optimizationRecs !== undefined) updateData.recommendations = data.optimizationRecs;
    if (data.commonProblems !== undefined) updateData.commonProblems = data.commonProblems;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.iconUrl !== undefined) updateData.icon = data.iconUrl;
    if (data.status !== undefined) {
      updateData.status = data.status === "active" ? "PUBLISHED" : "DRAFT";
    }

    const record = await prisma.game.update({
      where: { id },
      data: updateData,
    });
    return this.mapGame(record);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.game.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async setStatus(id: string, status: string): Promise<Game> {
    const record = await prisma.game.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: status as any },
    });
    return this.mapGame(record);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapGame(r: any): Game {
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      excerpt: r.excerpt,
      description: r.description || "",
      category: (r.genres?.[0] as GameCategory) || "other",
      platform: (r.platform?.toLowerCase() as Platform) || "android",
      performanceAreas: (r.performanceAreas as PerformanceArea[]) || [],
      tags: r.genres || [],
      deviceTier: (r.deviceTier as "low" | "mid" | "high") || "mid",
      optimizationRecs: r.recommendations || [],
      commonProblems: r.commonProblems || [],
      relatedToolSlugs: [],
      relatedAppSlugs: [],
      relatedGuideSlugs: [],
      featured: r.featured ?? false,
      iconUrl: r.icon || null,
      status: r.status === "PUBLISHED" ? "active" : "draft",
    };
  }
}

/* ── Prisma Apps Repository ──────────────────────────────────── */

export class PrismaAppRepository implements IAppRepository {
  async getById(id: string): Promise<App | null> {
    try {
      const record = await prisma.app.findUnique({
        where: { id },
        include: { releases: { orderBy: { releaseDate: "desc" } } },
      });
      return record ? this.mapApp(record) : null;
    } catch {
      return null;
    }
  }

  async getBySlug(slug: string): Promise<App | null> {
    try {
      const record = await prisma.app.findUnique({
        where: { slug },
        include: { releases: { orderBy: { releaseDate: "desc" } } },
      });
      return record ? this.mapApp(record) : null;
    } catch {
      return null;
    }
  }

  async listPublished(filters: AppFilterOptions = {}): Promise<PaginatedResult<App>> {
    try {
      const where: Record<string, unknown> = {
        status: "PUBLISHED",
      };

      if (typeof filters.requiresRoot === "boolean") {
        where.requiresRoot = filters.requiresRoot;
      }
      if (filters.verificationStatus) {
        where.verificationStatus = filters.verificationStatus;
      }
      if (filters.query?.trim()) {
        where.OR = [
          { name: { contains: filters.query.trim(), mode: "insensitive" } },
          { excerpt: { contains: filters.query.trim(), mode: "insensitive" } },
        ];
      }

      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        prisma.app.findMany({
          where,
          skip,
          take: limit,
          include: { releases: { orderBy: { releaseDate: "desc" } } },
          orderBy: { name: "asc" },
        }),
        prisma.app.count({ where }),
      ]);

      return {
        items: records.map((r) => this.mapApp(r)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch {
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };
    }
  }

  async listAll(): Promise<App[]> {
    try {
      const records = await prisma.app.findMany({
        include: { releases: { orderBy: { releaseDate: "desc" } } },
        orderBy: { name: "asc" },
      });
      return records.map((r) => this.mapApp(r));
    } catch {
      return [];
    }
  }

  async getLatestRelease(appSlug: string): Promise<AppRelease | null> {
    try {
      const app = await prisma.app.findUnique({
        where: { slug: appSlug },
        include: { releases: true },
      });
      if (!app?.releases || app.releases.length === 0) return null;
      const published = app.releases
        .map((r) => this.mapRelease(r))
        .filter((r) => !r.status || r.status.toLowerCase() === "published");
      if (published.length === 0) return null;
      published.sort(compareReleasesDesc);
      return published[0] ?? null;
    } catch {
      return null;
    }
  }

  async listReleases(appSlug: string): Promise<AppRelease[]> {
    try {
      const app = await prisma.app.findUnique({
        where: { slug: appSlug },
        include: { releases: true },
      });
      const mapped = app?.releases?.map((r) => this.mapRelease(r)) || [];
      mapped.sort(compareReleasesDesc);
      return mapped;
    } catch {
      return [];
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.app.count();
    } catch {
      return 0;
    }
  }

  async create(data: App): Promise<App> {
    const record = await prisma.app.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        packageName: data.packageName,
        excerpt: data.excerpt,
        description: data.description,
        developer: data.developer,
        website: data.developerUrl,
        license: data.license,
        requiresRoot: data.requiresRoot ?? false,
        targetSdkVersion: data.targetSdkVersion,
        features: data.features,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        permissions: data.permissions as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        installGuide: data.installGuide as any,
        status: data.status === "active" ? "PUBLISHED" : "DRAFT",
      },
      include: { releases: true, category: true },
    });
    return this.mapApp(record);
  }

  async update(id: string, data: Partial<App>): Promise<App> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.packageName !== undefined) updateData.packageName = data.packageName;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.developer !== undefined) updateData.developer = data.developer;
    if (data.developerUrl !== undefined) updateData.website = data.developerUrl;
    if (data.license !== undefined) updateData.license = data.license;
    if (data.requiresRoot !== undefined) updateData.requiresRoot = data.requiresRoot;
    if (data.targetSdkVersion !== undefined) updateData.targetSdkVersion = data.targetSdkVersion;
    if (data.features !== undefined) updateData.features = data.features;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    if (data.installGuide !== undefined) updateData.installGuide = data.installGuide;
    if (data.status !== undefined) {
      updateData.status = data.status === "active" || data.status === "stable" ? "PUBLISHED" : "DRAFT";
    }

    const record = await prisma.app.update({
      where: { id },
      data: updateData,
      include: { releases: true, category: true },
    });
    return this.mapApp(record);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.app.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async createRelease(appSlug: string, release: AppRelease): Promise<AppRelease> {
    const app = await prisma.app.findFirst({
      where: { OR: [{ slug: appSlug }, { id: appSlug }] },
    });
    if (!app) throw new Error(`App not found: ${appSlug}`);

    const rel = await prisma.appRelease.create({
      data: {
        appId: app.id,
        version: release.version,
        versionCode: release.versionCode,
        releaseDate: release.releaseDate ? new Date(release.releaseDate) : new Date(),
        androidMinVersion: release.androidMinVersion,
        targetSdkVersion: release.targetSdkVersion,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        architectures: release.architectures as any,
        fileSize: release.fileSize ? BigInt(release.fileSize) : undefined,
        downloadUrl: release.downloadUrl,
        sourceUrl: release.sourceUrl,
        sourceName: release.sourceName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sourceType: (release.sourceType?.toUpperCase() || "OFFICIAL_DEVELOPER") as any,
        checksumSha256: release.checksumSha256,
        checksumMd5: release.checksumMd5,
        checksumAlgorithm: release.checksumAlgorithm || "sha256",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        verificationStatus: (release.verificationStatus?.toUpperCase() || "PENDING") as any,
        verificationEvidence: release.verificationEvidence,
        storagePath: release.storagePath,
        fileName: release.fileName,
        mimeType: release.mimeType,
        fileSizeBytes: release.fileSizeBytes ? BigInt(release.fileSizeBytes) : (release.fileSize ? BigInt(release.fileSize) : undefined),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (release.status?.toUpperCase() || "PUBLISHED") as any,
        createdBy: release.createdBy,
        updatedBy: release.updatedBy,
        changelog: release.changelog,
      },
    });
    return this.mapRelease(rel as unknown as Record<string, unknown>);
  }

  async updateRelease(
    appSlug: string,
    releaseId: string,
    release: Partial<AppRelease>
  ): Promise<AppRelease> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (release.version !== undefined) updateData.version = release.version;
    if (release.versionCode !== undefined) updateData.versionCode = release.versionCode;
    if (release.releaseDate !== undefined) updateData.releaseDate = new Date(release.releaseDate);
    if (release.androidMinVersion !== undefined) updateData.androidMinVersion = release.androidMinVersion;
    if (release.targetSdkVersion !== undefined) updateData.targetSdkVersion = release.targetSdkVersion;
    if (release.architectures !== undefined) updateData.architectures = release.architectures;
    if (release.fileSize !== undefined) updateData.fileSize = BigInt(release.fileSize);
    if (release.downloadUrl !== undefined) updateData.downloadUrl = release.downloadUrl;
    if (release.sourceUrl !== undefined) updateData.sourceUrl = release.sourceUrl;
    if (release.sourceName !== undefined) updateData.sourceName = release.sourceName;
    if (release.sourceType !== undefined) updateData.sourceType = release.sourceType.toUpperCase();
    if (release.checksumSha256 !== undefined) updateData.checksumSha256 = release.checksumSha256;
    if (release.checksumMd5 !== undefined) updateData.checksumMd5 = release.checksumMd5;
    if (release.checksumAlgorithm !== undefined) updateData.checksumAlgorithm = release.checksumAlgorithm;
    if (release.verificationStatus !== undefined) updateData.verificationStatus = release.verificationStatus.toUpperCase();
    if (release.verificationEvidence !== undefined) updateData.verificationEvidence = release.verificationEvidence;
    if (release.storagePath !== undefined) updateData.storagePath = release.storagePath;
    if (release.fileName !== undefined) updateData.fileName = release.fileName;
    if (release.mimeType !== undefined) updateData.mimeType = release.mimeType;
    if (release.fileSizeBytes !== undefined) updateData.fileSizeBytes = BigInt(release.fileSizeBytes);
    if (release.status !== undefined) updateData.status = release.status.toUpperCase();
    if (release.updatedBy !== undefined) updateData.updatedBy = release.updatedBy;
    if (release.changelog !== undefined) updateData.changelog = release.changelog;

    const rel = await prisma.appRelease.update({
      where: { id: releaseId },
      data: updateData,
    });
    return this.mapRelease(rel as unknown as Record<string, unknown>);
  }

  async deleteRelease(appSlug: string, releaseId: string): Promise<boolean> {
    try {
      await prisma.appRelease.delete({ where: { id: releaseId } });
      return true;
    } catch {
      return false;
    }
  }

  async setStatus(id: string, status: string): Promise<App> {
    const record = await prisma.app.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: status as any },
      include: { releases: true, category: true },
    });
    return this.mapApp(record);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapApp(r: any): App {
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      packageName: r.packageName || undefined,
      excerpt: r.excerpt,
      description: r.description,
      developer: r.developer,
      developerUrl: r.website || undefined,
      license: r.license || "Freeware",
      category: r.category?.name || "Gaming Tools",
      platform: "android",
      status: r.status === "PUBLISHED" ? "active" : "coming-soon",
      requiresRoot: r.requiresRoot,
      targetSdkVersion: r.targetSdkVersion || undefined,
      minAndroidVersion: "8.0",
      minApiLevel: 26,
      architectures: ["arm64-v8a"],
      features: r.features || [],
      tags: r.features || [],
      permissions: r.permissions || [],
      releases:
        r.releases?.map((rel: Record<string, unknown>) => this.mapRelease(rel)) || [],
      installGuide: r.installGuide || {
        prerequisites: [],
        installationSteps: [],
        uninstallSteps: [],
      },
      relatedGames: [],
      relatedTools: [],
      relatedGuides: [],
      featured: false,
    };
  }

  private mapRelease(rel: Record<string, unknown>): AppRelease {
    return {
      id: rel.id ? String(rel.id) : undefined,
      version: String(rel.version || "1.0.0"),
      versionCode: typeof rel.versionCode === "number" ? rel.versionCode : undefined,
      releaseDate: rel.releaseDate
        ? new Date(rel.releaseDate as string | number | Date).toISOString().split("T")[0]!
        : "",
      androidMinVersion: String(rel.androidMinVersion || "8.0"),
      targetSdkVersion: rel.targetSdkVersion ? Number(rel.targetSdkVersion) : undefined,
      architectures: (rel.architectures as AppArchitecture[]) || ["arm64-v8a"],
      fileSize: rel.fileSize ? Number(rel.fileSize) : undefined,
      downloadUrl: rel.downloadUrl ? String(rel.downloadUrl) : undefined,
      sourceUrl: rel.sourceUrl ? String(rel.sourceUrl) : undefined,
      sourceName: String(rel.sourceName || "Official"),
      sourceType: ((rel.sourceType as string)?.toLowerCase() as AppRelease["sourceType"]) || "github_release",
      checksumSha256: rel.checksumSha256 ? String(rel.checksumSha256) : undefined,
      checksumMd5: rel.checksumMd5 ? String(rel.checksumMd5) : undefined,
      checksumAlgorithm: rel.checksumAlgorithm ? String(rel.checksumAlgorithm) : "sha256",
      verificationStatus: ((rel.verificationStatus as string)?.toLowerCase() as VerificationStatus) || "pending",
      verificationEvidence: rel.verificationEvidence ? String(rel.verificationEvidence) : undefined,
      storagePath: rel.storagePath ? String(rel.storagePath) : undefined,
      fileName: rel.fileName ? String(rel.fileName) : undefined,
      mimeType: rel.mimeType ? String(rel.mimeType) : "application/vnd.android.package-archive",
      fileSizeBytes: rel.fileSizeBytes ? Number(rel.fileSizeBytes) : (rel.fileSize ? Number(rel.fileSize) : undefined),
      status: ((rel.status as string)?.toLowerCase() as AppRelease["status"]) || "published",
      createdBy: rel.createdBy ? String(rel.createdBy) : undefined,
      updatedBy: rel.updatedBy ? String(rel.updatedBy) : undefined,
      changelog: (rel.changelog as string[]) || [],
    };
  }
}

/* ── Prisma Tools Repository ─────────────────────────────────── */

export class PrismaToolRepository implements IToolRepository {
  async getById(id: string): Promise<Tool | null> {
    try {
      const record = await prisma.tool.findUnique({ where: { id } });
      return record ? this.mapTool(record) : null;
    } catch {
      return null;
    }
  }

  async getBySlug(slug: string): Promise<Tool | null> {
    try {
      const record = await prisma.tool.findUnique({ where: { slug } });
      return record ? this.mapTool(record) : null;
    } catch {
      return null;
    }
  }

  async listPublished(filters: ToolFilterOptions = {}): Promise<Tool[]> {
    try {
      const where: Record<string, unknown> = {
        status: "PUBLISHED",
      };

      if (filters.platform && filters.platform !== "all") {
        where.platforms = { has: filters.platform };
      }
      if (filters.query?.trim()) {
        where.OR = [
          { name: { contains: filters.query.trim(), mode: "insensitive" } },
          { shortDescription: { contains: filters.query.trim(), mode: "insensitive" } },
        ];
      }

      const records = await prisma.tool.findMany({
        where,
        orderBy: { name: "asc" },
      });

      return records.map((r) => this.mapTool(r));
    } catch {
      return [];
    }
  }

  async listAll(): Promise<Tool[]> {
    try {
      const records = await prisma.tool.findMany({ orderBy: { name: "asc" } });
      return records.map((r) => this.mapTool(r));
    } catch {
      return [];
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.tool.count();
    } catch {
      return 0;
    }
  }

  async create(data: Tool): Promise<Tool> {
    const record = await prisma.tool.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        whatItDoes: data.whatItDoes,
        whatItMeasures: data.whatItMeasures,
        capabilities: data.capabilities,
        limitations: data.limitations,
        technicalExplanation: data.technicalExplanation,
        howToInterpret: data.howToInterpret,
        platforms: data.platforms,
        requiresWebGl: data.requiresWebGl ?? false,
        requiresRoot: data.requiresRoot ?? false,
        featured: data.featured ?? false,
        status: data.status === "available" || data.status === "beta" ? "PUBLISHED" : "DRAFT",
      },
    });
    return this.mapTool(record);
  }

  async update(id: string, data: Partial<Tool>): Promise<Tool> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.whatItDoes !== undefined) updateData.whatItDoes = data.whatItDoes;
    if (data.whatItMeasures !== undefined) updateData.whatItMeasures = data.whatItMeasures;
    if (data.capabilities !== undefined) updateData.capabilities = data.capabilities;
    if (data.limitations !== undefined) updateData.limitations = data.limitations;
    if (data.technicalExplanation !== undefined) updateData.technicalExplanation = data.technicalExplanation;
    if (data.howToInterpret !== undefined) updateData.howToInterpret = data.howToInterpret;
    if (data.platforms !== undefined) updateData.platforms = data.platforms;
    if (data.requiresWebGl !== undefined) updateData.requiresWebGl = data.requiresWebGl;
    if (data.requiresRoot !== undefined) updateData.requiresRoot = data.requiresRoot;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.status !== undefined) {
      updateData.status = data.status === "available" || data.status === "beta" ? "PUBLISHED" : "DRAFT";
    }

    const record = await prisma.tool.update({
      where: { id },
      data: updateData,
    });
    return this.mapTool(record);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.tool.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async setStatus(id: string, status: string): Promise<Tool> {
    const record = await prisma.tool.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: status as any },
    });
    return this.mapTool(record);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTool(r: any): Tool {
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      shortDescription: r.shortDescription,
      description: r.description,
      excerpt: r.shortDescription,
      category: (r.category?.slug?.replace("tool-", "") as ToolCategory) || "performance",
      platforms: (r.platforms as ToolPlatform[]) || ["web"],
      status: (r.status === "PUBLISHED" ? "available" : "coming-soon") as ToolStatus,
      whatItDoes: r.whatItDoes,
      whatItMeasures: r.whatItMeasures || [],
      capabilities: r.capabilities || [],
      limitations: r.limitations || [],
      technicalExplanation: r.technicalExplanation,
      howToInterpret: r.howToInterpret || [],
      featured: r.featured || false,
      difficulty: (r.difficulty?.toLowerCase() as Tool["difficulty"]) || "beginner",
      tags: r.capabilities || [],
      requiresWebGl: r.requiresWebGl || false,
      requiresRoot: r.requiresRoot || false,
      relatedToolSlugs: [],
      relatedGuideSlugs: [],
      relatedGameSlugs: [],
      requirements: {
        minApiLevel: null,
        requiresRoot: false,
        isWebBased: true,
      },
    };
  }
}

/* ── Prisma Guides Repository ────────────────────────────────── */

export class PrismaGuideRepository implements IGuideRepository {
  async getById(id: string): Promise<Guide | null> {
    try {
      const record = await prisma.guide.findUnique({
        where: { id },
        include: { category: true },
      });
      return record ? this.mapGuide(record) : null;
    } catch {
      return null;
    }
  }

  async getBySlug(slug: string): Promise<Guide | null> {
    try {
      const record = await prisma.guide.findUnique({
        where: { slug },
        include: { category: true },
      });
      return record ? this.mapGuide(record) : null;
    } catch {
      return null;
    }
  }

  async listPublished(filters: GuideFilterOptions = {}): Promise<PaginatedResult<Guide>> {
    try {
      const where: Record<string, unknown> = {
        status: "PUBLISHED",
      };

      if (filters.difficulty && filters.difficulty !== "all") {
        where.difficulty = filters.difficulty.toUpperCase();
      }
      if (filters.contentType && filters.contentType !== "all") {
        where.contentType = filters.contentType.toUpperCase();
      }
      if (filters.query?.trim()) {
        where.OR = [
          { title: { contains: filters.query.trim(), mode: "insensitive" } },
          { excerpt: { contains: filters.query.trim(), mode: "insensitive" } },
        ];
      }

      const total = await prisma.guide.count({ where });
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;

      const records = await prisma.guide.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { publishedAt: "desc" },
      });

      return {
        items: records.map((r) => this.mapGuide(r)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch {
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };
    }
  }

  async listAll(filters?: GuideFilterOptions): Promise<Guide[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};
      if (filters?.status && filters.status !== "all") {
        where.status = filters.status.toUpperCase();
      }
      if (filters?.query?.trim()) {
        where.OR = [
          { title: { contains: filters.query.trim(), mode: "insensitive" } },
          { excerpt: { contains: filters.query.trim(), mode: "insensitive" } },
        ];
      }
      const records = await prisma.guide.findMany({
        where,
        include: { category: true },
        orderBy: { publishedAt: "desc" },
      });
      return records.map((r) => this.mapGuide(r));
    } catch {
      return [];
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.guide.count();
    } catch {
      return 0;
    }
  }

  async create(data: Guide): Promise<Guide> {
    const record = await prisma.guide.create({
      data: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        excerpt: data.excerpt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contentType: (data.contentType?.toUpperCase() || "GUIDE") as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        difficulty: (data.difficulty?.toUpperCase() || "BEGINNER") as any,
        readingTimeMinutes: data.readingTimeMinutes || 5,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sections: data.sections as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        faqs: data.faqs as any,
        authorName: data.author?.name || "Moha Staff",
        authorRole: data.author?.role,
        status: data.status === "published" ? "PUBLISHED" : "DRAFT",
      },
      include: { category: true },
    });
    return this.mapGuide(record);
  }

  async update(id: string, data: Partial<Guide>): Promise<Guide> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.contentType !== undefined) updateData.contentType = data.contentType.toUpperCase();
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty.toUpperCase();
    if (data.readingTimeMinutes !== undefined) updateData.readingTimeMinutes = data.readingTimeMinutes;
    if (data.sections !== undefined) updateData.sections = data.sections;
    if (data.faqs !== undefined) updateData.faqs = data.faqs;
    if (data.author?.name !== undefined) updateData.authorName = data.author.name;
    if (data.author?.role !== undefined) updateData.authorRole = data.author.role;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.status !== undefined) {
      updateData.status = data.status === "published" ? "PUBLISHED" : "DRAFT";
    }

    const record = await prisma.guide.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
    return this.mapGuide(record);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.guide.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async setStatus(id: string, status: string): Promise<Guide> {
    const record = await prisma.guide.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: status as any },
      include: { category: true },
    });
    return this.mapGuide(record);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapGuide(r: any): Guide {
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      excerpt: r.excerpt,
      category: (r.category?.name as GuideCategory) || "Android Gaming",
      contentType: (r.contentType as GuideContentType) || "Guide",
      difficulty: (r.difficulty as GuideDifficulty) || "Beginner",
      readingTimeMinutes: r.readingTimeMinutes || 5,
      sections: r.sections || [],
      faqs: r.faqs || [],
      author: {
        name: r.authorName || "Moha Gaming Lab",
        role: r.authorRole || undefined,
      },
      tags: [],
      gameIds: [],
      toolIds: [],
      appIds: [],
      relatedGuideSlugs: [],
      publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      status: r.status === "PUBLISHED" ? "published" : "draft",
      version: "1.0",
      featured: r.featured ?? false,
    };
  }
}

/* ── Prisma Category & Tag Repositories ──────────────────────── */

export class PrismaCategoryRepository implements ICategoryRepository {
  async listAll(sectionType?: "GAME" | "APP" | "TOOL" | "GUIDE"): Promise<CategoryRecord[]> {
    try {
      const where = sectionType ? { sectionType } : {};
      const records = await prisma.category.findMany({ where, orderBy: { name: "asc" } });
      return records.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        sectionType: c.sectionType as CategoryRecord["sectionType"],
      }));
    } catch {
      return [];
    }
  }

  async getBySlug(slug: string): Promise<CategoryRecord | null> {
    try {
      const record = await prisma.category.findUnique({ where: { slug } });
      return record
        ? {
            id: record.id,
            slug: record.slug,
            name: record.name,
            sectionType: record.sectionType as CategoryRecord["sectionType"],
          }
        : null;
    } catch {
      return null;
    }
  }

  async create(data: {
    name: string;
    slug: string;
    sectionType: "GAME" | "APP" | "TOOL" | "GUIDE";
  }): Promise<CategoryRecord> {
    const record = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        sectionType: data.sectionType,
      },
    });
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      sectionType: record.sectionType as CategoryRecord["sectionType"],
    };
  }

  async update(id: string, data: { name?: string; slug?: string }): Promise<CategoryRecord> {
    const record = await prisma.category.update({
      where: { id },
      data,
    });
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      sectionType: record.sectionType as CategoryRecord["sectionType"],
    };
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.category.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

export class PrismaTagRepository implements ITagRepository {
  async listAll(): Promise<TagRecord[]> {
    try {
      const records = await prisma.tag.findMany({ orderBy: { name: "asc" } });
      return records.map((t) => ({ id: t.id, slug: t.slug, name: t.name }));
    } catch {
      return [];
    }
  }

  async getBySlug(slug: string): Promise<TagRecord | null> {
    try {
      const record = await prisma.tag.findUnique({ where: { slug } });
      return record ? { id: record.id, slug: record.slug, name: record.name } : null;
    } catch {
      return null;
    }
  }

  async create(data: { name: string; slug: string }): Promise<TagRecord> {
    const record = await prisma.tag.create({
      data: { name: data.name, slug: data.slug },
    });
    return { id: record.id, slug: record.slug, name: record.name };
  }

  async rename(id: string, name: string): Promise<TagRecord> {
    const record = await prisma.tag.update({
      where: { id },
      data: { name },
    });
    return { id: record.id, slug: record.slug, name: record.name };
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.tag.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
