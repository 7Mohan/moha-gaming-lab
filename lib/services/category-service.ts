/**
 * lib/services/category-service.ts
 * ────────────────────────────────────────────────────────────────
 * Reusable taxonomy category service.
 */

import { categoryRepository } from "../repositories";
import type { CategoryRecord } from "../repositories/types";

export async function getCategories(
  sectionType?: "GAME" | "APP" | "TOOL" | "GUIDE"
): Promise<CategoryRecord[]> {
  return await categoryRepository.listAll(sectionType);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
  if (!slug?.trim()) return null;
  return await categoryRepository.getBySlug(slug.trim());
}

export async function createCategory(data: {
  name: string;
  slug: string;
  sectionType: "GAME" | "APP" | "TOOL" | "GUIDE";
}): Promise<CategoryRecord> {
  return await categoryRepository.create(data);
}

export async function updateCategory(
  id: string,
  data: { name?: string; slug?: string }
): Promise<CategoryRecord> {
  return await categoryRepository.update(id, data);
}

export async function deleteCategory(id: string): Promise<boolean> {
  return await categoryRepository.delete(id);
}
