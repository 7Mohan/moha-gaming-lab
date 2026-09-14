/**
 * lib/storage/index.ts
 * ────────────────────────────────────────────────────────────────
 * Storage Provider Registry & Factory.
 */

import { SupabaseStorageProvider } from "./supabase-storage";
import type { IStorageProvider } from "./types";

let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageInstance) {
    storageInstance = new SupabaseStorageProvider();
  }
  return storageInstance;
}

export * from "./types";
export * from "./validation";
export * from "./supabase-storage";
