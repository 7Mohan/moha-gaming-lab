/**
 * lib/services/game-service.ts
 * ────────────────────────────────────────────────────────────────
 * Application service for Game profiles, hardware tier ratings, and optimizations.
 */

import { gameRepository } from "../repositories";
import type { Game } from "@/types/game";
import type { GameFilterOptions, PaginatedResult } from "../repositories/types";

export async function getPublishedGames(
  filters: GameFilterOptions = {}
): Promise<PaginatedResult<Game>> {
  return await gameRepository.listPublished(filters);
}

export async function getAllGames(
  filters: GameFilterOptions = {}
): Promise<Game[]> {
  return await gameRepository.listAll(filters);
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  if (!slug?.trim()) return null;
  return await gameRepository.getBySlug(slug.trim().toLowerCase());
}

export async function getGameById(id: string): Promise<Game | null> {
  if (!id?.trim()) return null;
  return await gameRepository.getById(id.trim());
}

export async function getAllGameSlugs(): Promise<string[]> {
  const games = await gameRepository.listAll();
  return games.map((g) => g.slug);
}

export async function getGameCount(): Promise<number> {
  return await gameRepository.count();
}

export async function createGame(data: Game): Promise<Game> {
  return await gameRepository.create(data);
}

export async function updateGame(id: string, data: Partial<Game>): Promise<Game> {
  return await gameRepository.update(id, data);
}

export async function deleteGame(id: string): Promise<boolean> {
  return await gameRepository.delete(id);
}

export async function setGameStatus(id: string, status: string): Promise<Game> {
  return await gameRepository.setStatus(id, status);
}
