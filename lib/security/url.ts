/**
 * lib/security/url.ts
 * ────────────────────────────────────────────────────────────────
 * URL security, protocol validation, and open-redirect protection.
 */

const TRUSTED_DOMAINS = [
  "mohagaminglab.com",
  "localhost",
  "github.com",
  "raw.githubusercontent.com",
  "f-droid.org",
  "play.google.com",
  "shizuku.rikka.app",
];

const DISALLOWED_SCHEMES = [
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "blob:",
  "about:",
];

/**
 * Validates whether a URL is secure (HTTPS or HTTP in dev, no dangerous schemes).
 */
export function isSafeUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;

  const trimmed = urlStr.trim().toLowerCase();

  // Block dangerous pseudo-protocols
  for (const scheme of DISALLOWED_SCHEMES) {
    if (trimmed.startsWith(scheme)) return false;
  }

  // Relative paths starting with '/' are safe
  if (urlStr.startsWith("/") && !urlStr.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Validates a redirect destination to prevent open-redirect vulnerabilities.
 * Allows relative paths and verified trusted download domains.
 */
export function isSafeRedirectUrl(targetUrl: string, allowedHost?: string): boolean {
  if (!isSafeUrl(targetUrl)) return false;

  // Relative URLs are safe
  if (targetUrl.startsWith("/") && !targetUrl.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(targetUrl);
    if (allowedHost && parsed.hostname === allowedHost) return true;

    // Check if hostname matches or ends with any trusted domain
    return TRUSTED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitizes an external link for target="_blank" rel="noopener noreferrer"
 */
export function getSafeExternalLinkProps(url: string) {
  const safe = isSafeUrl(url);
  return {
    href: safe ? url : "#",
    target: "_blank",
    rel: "noopener noreferrer",
  };
}
