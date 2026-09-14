/**
 * lib/observability/logger.ts
 * ────────────────────────────────────────────────────────────────
 * Lightweight production structured logger for Moha Gaming Lab.
 * Formats: timestamp, level, event, route, requestId, metadata, errorCode.
 * Automatically scrubs sensitive credentials (passwords, tokens, cookies).
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  event: string;
  route?: string;
  requestId?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
  error?: Error | unknown;
}

const FORBIDDEN_LOG_KEYS = [
  "password",
  "token",
  "secret",
  "cookie",
  "key",
  "auth",
  "credential",
  "authorization",
];

/**
 * Generates an opaque, traceable Request Correlation ID.
 * Format: req_<hex-timestamp>_<random-hex>
 */
export function generateRequestId(): string {
  const ts = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 10);
  return `req_${ts}_${rand}`;
}

/**
 * Recursively sanitizes metadata to avoid logging sensitive user credentials or keys.
 */
export function scrubMetadata(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => scrubMetadata(item));
  }

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const lower = k.toLowerCase();
    if (FORBIDDEN_LOG_KEYS.some((f) => lower.includes(f))) {
      clean[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      clean[k] = scrubMetadata(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Emits a structured log entry to stdout / stderr.
 */
export function logStructured(entry: LogEntry): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level: entry.level,
    event: entry.event,
    route: entry.route,
    requestId: entry.requestId,
    errorCode: entry.errorCode,
    metadata: entry.metadata ? scrubMetadata(entry.metadata) : undefined,
    errorMessage:
      entry.error instanceof Error
        ? entry.error.message
        : entry.error
        ? String(entry.error)
        : undefined,
  };

  const jsonStr = JSON.stringify(payload);

  if (entry.level === "error") {
    console.error(jsonStr);
  } else if (entry.level === "warn") {
    console.warn(jsonStr);
  } else {
    console.log(jsonStr);
  }
}
