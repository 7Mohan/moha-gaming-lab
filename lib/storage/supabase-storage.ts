/**
 * lib/storage/supabase-storage.ts
 * ────────────────────────────────────────────────────────────────
 * Supabase Storage Provider implementation for Moha Gaming Lab.
 * Manages the private 'app-releases' bucket for hosted APK binaries.
 * 
 * Invariants:
 * - NEVER exposed directly to browser/client.
 * - Uses service_role client on server to administer the bucket.
 * - Anonymous downloads are mediated exclusively via short-lived signed URLs.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  IStorageProvider,
  FileMetadata,
  StorageUploadResult,
  SignedUrlResult,
} from "./types";
import { calculateSha256, sanitizeFileName } from "./validation";

export const APP_RELEASES_BUCKET = "app-releases";
export const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 900; // 15 minutes

// In-memory mock storage fallback for offline development/testing
const memoryStorage = new Map<string, { buffer: Buffer; mimeType: string; updatedAt: string }>();

export class SupabaseStorageProvider implements IStorageProvider {
  private readonly bucket: string;

  constructor(bucket: string = APP_RELEASES_BUCKET) {
    this.bucket = bucket;
  }

  async upload(
    storagePath: string,
    fileBuffer: Buffer | Uint8Array,
    mimeType: string = "application/vnd.android.package-archive"
  ): Promise<StorageUploadResult> {
    const cleanPath = storagePath.replace(/^\/+/, "");
    const fileName = sanitizeFileName(cleanPath.split("/").pop() || "release.apk");
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    const checksumSha256 = calculateSha256(buffer);

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      // Offline / in-memory fallback
      memoryStorage.set(cleanPath, {
        buffer,
        mimeType,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        storagePath: cleanPath,
        fileName,
        fileSizeBytes: buffer.length,
        mimeType,
        checksumSha256,
      };
    }

    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .upload(cleanPath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        return {
          success: false,
          storagePath: cleanPath,
          fileName,
          fileSizeBytes: buffer.length,
          mimeType,
          checksumSha256,
          error: `Supabase Storage upload failed: ${error.message}`,
        };
      }

      return {
        success: true,
        storagePath: cleanPath,
        fileName,
        fileSizeBytes: buffer.length,
        mimeType,
        checksumSha256,
      };
    } catch (err: unknown) {
      return {
        success: false,
        storagePath: cleanPath,
        fileName,
        fileSizeBytes: buffer.length,
        mimeType,
        checksumSha256,
        error: err instanceof Error ? err.message : "Unexpected storage failure during upload.",
      };
    }
  }

  async delete(storagePath: string): Promise<boolean> {
    const cleanPath = storagePath.replace(/^\/+/, "");
    memoryStorage.delete(cleanPath);

    const supabase = getSupabaseAdminClient();
    if (!supabase) return true;

    try {
      const { error } = await supabase.storage.from(this.bucket).remove([cleanPath]);
      return !error;
    } catch {
      return false;
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const cleanPath = storagePath.replace(/^\/+/, "");
    if (memoryStorage.has(cleanPath)) return true;

    const supabase = getSupabaseAdminClient();
    if (!supabase) return false;

    try {
      const parts = cleanPath.split("/");
      const fileName = parts.pop();
      const folder = parts.join("/");

      const { data, error } = await supabase.storage.from(this.bucket).list(folder, {
        search: fileName,
        limit: 10,
      });

      if (error || !data) return false;
      return data.some((item) => item.name === fileName);
    } catch {
      return false;
    }
  }

  async getMetadata(storagePath: string): Promise<FileMetadata | null> {
    const cleanPath = storagePath.replace(/^\/+/, "");
    const inMem = memoryStorage.get(cleanPath);
    if (inMem) {
      return {
        name: cleanPath.split("/").pop() || "release.apk",
        sizeBytes: inMem.buffer.length,
        mimeType: inMem.mimeType,
        checksumSha256: calculateSha256(inMem.buffer),
        createdAt: inMem.updatedAt,
        updatedAt: inMem.updatedAt,
      };
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) return null;

    try {
      const parts = cleanPath.split("/");
      const fileName = parts.pop();
      const folder = parts.join("/");

      const { data, error } = await supabase.storage.from(this.bucket).list(folder, {
        search: fileName,
        limit: 1,
      });

      if (error || !data || data.length === 0) return null;
      const file = data[0];
      if (!file) return null;

      return {
        name: file.name,
        sizeBytes: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || "application/vnd.android.package-archive",
        createdAt: file.created_at || new Date().toISOString(),
        updatedAt: file.updated_at || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async createSignedUrl(
    storagePath: string,
    expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRY_SECONDS
  ): Promise<SignedUrlResult> {
    const cleanPath = storagePath.replace(/^\/+/, "");
    const fileName = cleanPath.split("/").pop() || "release.apk";

    // In-memory fallback
    if (memoryStorage.has(cleanPath)) {
      const expiry = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      return {
        success: true,
        signedUrl: `/api/download/artifact?path=${encodeURIComponent(cleanPath)}&expires=${Date.now() + expiresInSeconds * 1000}`,
        expiresAt: expiry,
      };
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return {
        success: false,
        error: "Supabase storage service is not configured.",
      };
    }

    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .createSignedUrl(cleanPath, expiresInSeconds, {
          download: fileName,
        });

      if (error || !data?.signedUrl) {
        return {
          success: false,
          error: error?.message || "Failed to generate signed download URL.",
        };
      }

      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      return {
        success: true,
        signedUrl: data.signedUrl,
        expiresAt,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unexpected error generating download authorization.",
      };
    }
  }

  async listObjects(prefix: string = ""): Promise<string[]> {
    const cleanPrefix = prefix.replace(/^\/+/, "");
    const inMemKeys = Array.from(memoryStorage.keys()).filter((k) =>
      cleanPrefix ? k.startsWith(cleanPrefix) : true
    );

    const supabase = getSupabaseAdminClient();
    if (!supabase) return inMemKeys;

    try {
      const { data, error } = await supabase.storage.from(this.bucket).list(cleanPrefix, {
        limit: 1000,
      });

      if (error || !data) return inMemKeys;
      const remoteKeys = data.map((item) => (cleanPrefix ? `${cleanPrefix}/${item.name}` : item.name));
      return Array.from(new Set([...inMemKeys, ...remoteKeys]));
    } catch {
      return inMemKeys;
    }
  }
}
