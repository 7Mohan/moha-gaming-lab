/**
 * lib/download/types.ts
 * ────────────────────────────────────────────────────────────────
 * Download resolution types and error contracts.
 */

export interface DownloadResolution {
  success: boolean;
  type?: "hosted" | "external";
  url?: string;
  isDirect?: boolean;
  fileName?: string;
  fileSizeBytes?: number;
  checksumSha256?: string;
  verificationStatus?: string;
  error?: string;
  statusCode?: number;
}
