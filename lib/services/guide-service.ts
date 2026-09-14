/**
 * lib/services/guide-service.ts
 * ────────────────────────────────────────────────────────────────
 * Application service for technical knowledge base guides and tutorials.
 */

import { guideRepository } from "../repositories";
import type { Guide } from "@/types/guide";
import type { GuideFilterOptions, PaginatedResult } from "../repositories/types";

export async function getPublishedGuides(
  filters: GuideFilterOptions = {}
): Promise<PaginatedResult<Guide>> {
  return await guideRepository.listPublished(filters);
}

export async function getAllGuides(
  filters: GuideFilterOptions = {}
): Promise<Guide[]> {
  return await guideRepository.listAll(filters);
}

export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  if (!slug?.trim()) return null;
  return await guideRepository.getBySlug(slug.trim().toLowerCase());
}

export async function getGuideById(id: string): Promise<Guide | null> {
  if (!id?.trim()) return null;
  return await guideRepository.getById(id.trim());
}

export async function getAllGuideSlugs(): Promise<string[]> {
  const guides = await guideRepository.listAll();
  return guides.map((g) => g.slug);
}

export async function getGuideCount(): Promise<number> {
  return await guideRepository.count();
}

export async function createGuide(data: Guide): Promise<Guide> {
  return await guideRepository.create(data);
}

export async function updateGuide(id: string, data: Partial<Guide>): Promise<Guide> {
  return await guideRepository.update(id, data);
}

export async function deleteGuide(id: string): Promise<boolean> {
  return await guideRepository.delete(id);
}

export async function setGuideStatus(id: string, status: string): Promise<Guide> {
  return await guideRepository.setStatus(id, status);
}
