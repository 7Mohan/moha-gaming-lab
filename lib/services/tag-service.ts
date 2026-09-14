/**
 * lib/services/tag-service.ts
 * ────────────────────────────────────────────────────────────────
 * Reusable tag system service.
 */

import { tagRepository } from "../repositories";
import type { TagRecord } from "../repositories/types";

export async function getAllTags(): Promise<TagRecord[]> {
  return await tagRepository.listAll();
}

export async function getTagBySlug(slug: string): Promise<TagRecord | null> {
  if (!slug?.trim()) return null;
  return await tagRepository.getBySlug(slug.trim());
}

export async function createTag(data: { name: string; slug: string }): Promise<TagRecord> {
  return await tagRepository.create(data);
}

export async function renameTag(id: string, name: string): Promise<TagRecord> {
  return await tagRepository.rename(id, name);
}

export async function deleteTag(id: string): Promise<boolean> {
  return await tagRepository.delete(id);
}
