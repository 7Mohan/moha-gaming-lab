/**
 * lib/security/sanitize.ts
 * ────────────────────────────────────────────────────────────────
 * Text and Markdown sanitization utilities to prevent stored XSS and HTML injection.
 */

/**
 * Strips dangerous HTML tags from raw user text or imported descriptions.
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, "")
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, "")
    .replace(/on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, "") // remove inline event handlers (onerror=, onload=)
    .replace(/(?:href|src)\s*=\s*["']?\s*(?:javascript|vbscript|data:\s*text\/html):[^"'>\s]*/gi, "") // remove scriptable URIs
    .replace(/\bjavascript:\s*/gi, "") // remove standalone javascript: pseudo-protocols
    .trim();
}

/**
 * Escapes characters for safe HTML output when string interpolation is needed.
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
