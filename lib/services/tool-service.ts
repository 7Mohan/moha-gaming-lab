/**
 * lib/services/tool-service.ts
 * ────────────────────────────────────────────────────────────────
 * Application service for browser gaming performance diagnostics and utilities.
 */

import { toolRepository } from "../repositories";
import type { Tool } from "@/types/tool";
import type { ToolFilterOptions } from "../repositories/types";

export async function getPublishedTools(filters: ToolFilterOptions = {}): Promise<Tool[]> {
  return await toolRepository.listPublished(filters);
}

export async function getAllTools(): Promise<Tool[]> {
  return await toolRepository.listAll();
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  if (!slug?.trim()) return null;
  return await toolRepository.getBySlug(slug.trim().toLowerCase());
}

export async function getToolById(id: string): Promise<Tool | null> {
  if (!id?.trim()) return null;
  return await toolRepository.getById(id.trim());
}

export async function getAllToolSlugs(): Promise<string[]> {
  const tools = await toolRepository.listAll();
  return tools.map((t) => t.slug);
}

export async function getToolCount(): Promise<number> {
  return await toolRepository.count();
}

export async function createTool(data: Tool): Promise<Tool> {
  return await toolRepository.create(data);
}

export async function updateTool(id: string, data: Partial<Tool>): Promise<Tool> {
  return await toolRepository.update(id, data);
}

export async function deleteTool(id: string): Promise<boolean> {
  return await toolRepository.delete(id);
}

export async function setToolStatus(id: string, status: string): Promise<Tool> {
  return await toolRepository.setStatus(id, status);
}
