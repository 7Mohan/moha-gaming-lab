/**
 * lib/db/prisma.ts
 * ────────────────────────────────────────────────────────────────
 * Global singleton Prisma Client instance for Moha Gaming Lab.
 * Prevents multiple active connections in Next.js development hot-reloading.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function initPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/**
 * Lazy Prisma client proxy that defers instantiation until first query.
 * Prevents initialization errors during static builds or environments without live database credentials.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = initPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});
