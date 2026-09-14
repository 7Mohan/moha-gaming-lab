/**
 * lib/admin/audit.ts
 * ────────────────────────────────────────────────────────────────
 * Audit log recorder — tracks all significant admin actions.
 * Uses the database when available, silently no-ops when offline.
 * Never logs passwords, secrets, or PII beyond userId and action metadata.
 */

import { hasDatabaseUrl } from "../env";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "PUBLISH"
  | "ARCHIVE"
  | "DELETE"
  | "VERIFY"
  | "LOGIN"
  | "LOGOUT"
  | "SUBMIT_REVIEW"
  | "MERGE";

export interface AuditEntry {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entitySlug?: string;
  /** Safe metadata — no passwords, no secrets */
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory fallback for local dev/testing when database is offline
const inMemoryAuditLogs: AuditLogEntry[] = [];

/**
 * Records an audit log entry to the database (or in-memory store if offline).
 * Fails silently — audit logging must never break primary operations.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  const inMemEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entitySlug: entry.entitySlug,
    userName: entry.userId ? "Admin User" : "System",
    createdAt: new Date().toISOString(),
  };
  inMemoryAuditLogs.unshift(inMemEntry);
  if (inMemoryAuditLogs.length > 100) inMemoryAuditLogs.pop();

  if (!hasDatabaseUrl()) return;

  try {
    // Lazy import to avoid startup errors when database is unavailable
    const { prisma } = await import("../db/prisma");
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        action: entry.action as any,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: entry.metadata ? (entry.metadata as any) : undefined,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch {
    // Audit failure must never break the primary operation
    if (process.env.NODE_ENV === "development") {
      console.warn("[Audit] Failed to record audit entry:", entry.action, entry.entityType);
    }
  }
}

/**
 * Returns recent audit log entries for the admin dashboard.
 * Ordered by newest first. Limit defaults to 20.
 */
export async function getRecentAuditEntries(limit = 20): Promise<AuditLogEntry[]> {
  if (!hasDatabaseUrl()) return inMemoryAuditLogs.slice(0, limit);

  try {
    const { prisma } = await import("../db/prisma");
    const entries = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true, role: true } } },
    });

    return entries.map((e) => ({
      id: e.id,
      action: e.action as AuditAction,
      entityType: e.entityType,
      entityId: e.entityId ?? undefined,
      entitySlug: e.entitySlug ?? undefined,
      userName: e.user?.name ?? "System",
      userEmail: e.user?.email ?? undefined,
      createdAt: e.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entitySlug?: string;
  userName: string;
  userEmail?: string;
  createdAt: string;
}
