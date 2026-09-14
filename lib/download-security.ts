/**
 * Download Security Utilities — Moha Gaming Lab
 * Prevents open redirects, unsafe protocols, and validates external download origins.
 */

const TRUSTED_DOMAINS = [
  "github.com",
  "objects.githubusercontent.com",
  "f-droid.org",
  "gitlab.com",
  "codeberg.org",
  "sourceware.org",
  "franco-lapo.github.io",
  "netguard.me",
  "mohagaminglab.com",
];

/**
 * Validates that a download or source URL is safe to dispatch or render.
 * Must be HTTPS, cannot be local/loopback, and cannot use javascript:/data: protocols.
 */
export function isSafeDownloadUrl(url?: string | null): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);

    // Enforce HTTPS
    if (parsed.protocol !== "https:") {
      return false;
    }

    // Disallow loopback and local networks
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a domain is on the pre-approved trusted distribution list.
 */
export function isTrustedDomain(url?: string | null): boolean {
  if (!url || !isSafeDownloadUrl(url)) return false;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return TRUSTED_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Formats raw file size in bytes to human-readable MB / KB string.
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats a SHA-256 or MD5 hash for compact monospace display.
 */
export function truncateHash(hash?: string | null, length = 12): string {
  if (!hash) return "Not available";
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-6)}`;
}
