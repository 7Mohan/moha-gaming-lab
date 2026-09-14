/**
 * lib/services/app-service.ts
 * ────────────────────────────────────────────────────────────────
 * Application service for Android applications, versioned releases,
 * and verified download sources.
 */

import { appRepository } from "../repositories";
import type { App, AppRelease } from "@/types/app";
import type { AppFilterOptions, PaginatedResult } from "../repositories/types";

export async function getPublishedApps(
  filters: AppFilterOptions = {}
): Promise<PaginatedResult<App>> {
  return await appRepository.listPublished(filters);
}

export async function getAllApps(
  filters: AppFilterOptions = {}
): Promise<App[]> {
  return await appRepository.listAll(filters);
}

export async function getAppBySlug(slug: string): Promise<App | null> {
  if (!slug?.trim()) return null;
  return await appRepository.getBySlug(slug.trim().toLowerCase());
}

export async function getAppById(id: string): Promise<App | null> {
  if (!id?.trim()) return null;
  return await appRepository.getById(id.trim());
}

export async function getLatestAppRelease(appSlug: string): Promise<AppRelease | null> {
  if (!appSlug?.trim()) return null;
  return await appRepository.getLatestRelease(appSlug.trim().toLowerCase());
}

export async function getAppReleases(appSlug: string): Promise<AppRelease[]> {
  if (!appSlug?.trim()) return [];
  return await appRepository.listReleases(appSlug.trim().toLowerCase());
}

export async function getAllAppSlugs(): Promise<string[]> {
  const apps = await appRepository.listAll();
  return apps.map((a) => a.slug);
}

export async function getAppCount(): Promise<number> {
  return await appRepository.count();
}

export async function createApp(data: App): Promise<App> {
  return await appRepository.create(data);
}

export async function updateApp(id: string, data: Partial<App>): Promise<App> {
  return await appRepository.update(id, data);
}

export async function deleteApp(id: string): Promise<boolean> {
  return await appRepository.delete(id);
}

export async function createRelease(appSlug: string, release: AppRelease): Promise<AppRelease> {
  return await appRepository.createRelease(appSlug, release);
}

export async function updateRelease(
  appSlug: string,
  releaseId: string,
  release: Partial<AppRelease>
): Promise<AppRelease> {
  return await appRepository.updateRelease(appSlug, releaseId, release);
}

export async function deleteRelease(appSlug: string, releaseId: string): Promise<boolean> {
  return await appRepository.deleteRelease(appSlug, releaseId);
}

export async function setAppStatus(id: string, status: string): Promise<App> {
  return await appRepository.setStatus(id, status);
}
