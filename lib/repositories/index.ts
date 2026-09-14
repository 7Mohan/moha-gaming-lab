/**
 * lib/repositories/index.ts
 * ────────────────────────────────────────────────────────────────
 * Repository Factory & Registry for Moha Gaming Lab.
 *
 * Seamlessly selects between Prisma PostgreSQL repositories and
 * zero-latency static repositories based on environment availability.
 */

import { hasDatabaseUrl } from "../env";
import {
  StaticGameRepository,
  StaticAppRepository,
  StaticToolRepository,
  StaticGuideRepository,
  StaticCategoryRepository,
  StaticTagRepository,
} from "./static-repository";
import {
  PrismaGameRepository,
  PrismaAppRepository,
  PrismaToolRepository,
  PrismaGuideRepository,
  PrismaCategoryRepository,
  PrismaTagRepository,
} from "./prisma-repository";
import type {
  IGameRepository,
  IAppRepository,
  IToolRepository,
  IGuideRepository,
  ICategoryRepository,
  ITagRepository,
} from "./types";

export * from "./types";

const useDatabase = hasDatabaseUrl();

export const gameRepository: IGameRepository = useDatabase
  ? new PrismaGameRepository()
  : new StaticGameRepository();

export const appRepository: IAppRepository = useDatabase
  ? new PrismaAppRepository()
  : new StaticAppRepository();

export const toolRepository: IToolRepository = useDatabase
  ? new PrismaToolRepository()
  : new StaticToolRepository();

export const guideRepository: IGuideRepository = useDatabase
  ? new PrismaGuideRepository()
  : new StaticGuideRepository();

export const categoryRepository: ICategoryRepository = useDatabase
  ? new PrismaCategoryRepository()
  : new StaticCategoryRepository();

export const tagRepository: ITagRepository = useDatabase
  ? new PrismaTagRepository()
  : new StaticTagRepository();
