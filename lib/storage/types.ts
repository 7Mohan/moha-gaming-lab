/**
 * lib/storage/types.ts
 * ────────────────────────────────────────────────────────────────
 * Storage provider contracts and abstractions for Moha Gaming Lab.
 * Enables zero-coupling switching between Supabase Storage, S3,
 * Cloudflare R2, or Bunny Storage without altering business logic.
 */

export interface FileMetadata {
  name: string;
  sizeBytes: number;
  mimeType: string;
  checksumSha256?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageUploadResult {
  success: boolean;
  storagePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  checksumSha256: string;
  error?: string;
}

export interface SignedUrlResult {
  success: boolean;
  signedUrl?: string;
  expiresAt?: string;
  error?: string;
}

export interface IStorageProvider {
  /**
   * Uploads an artifact buffer to the specified server-sanitized path.
   */
  upload(
    storagePath: string,
    fileBuffer: Buffer | Uint8Array,
    mimeType: string
  ): Promise<StorageUploadResult>;

  /**
   * Deletes an object at the specified storage path.
   */
  delete(storagePath: string): Promise<boolean>;

  /**
   * Checks if an object exists at the specified storage path.
   */
  exists(storagePath: string): Promise<boolean>;

  /**
   * Retrieves metadata for a stored object without reading its full content into memory.
   */
  getMetadata(storagePath: string): Promise<FileMetadata | null>;

  /**
   * Creates a short-lived signed URL for client download access.
   */
  createSignedUrl(
    storagePath: string,
    expiresInSeconds?: number
  ): Promise<SignedUrlResult>;

  /**
   * Lists object paths under a given prefix in the storage bucket.
   */
  listObjects(prefix?: string): Promise<string[]>;
}
