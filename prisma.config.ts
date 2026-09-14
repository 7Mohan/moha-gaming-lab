// prisma.config.ts
// Prisma 7 configuration file.
// Connection URLs live here — NOT in prisma/schema.prisma.
//
// DATABASE_URL → PgBouncer transaction pooler (port 6543) — for serverless runtime (Vercel)
// DIRECT_URL   → Direct or session pooler (port 5432)     — for prisma migrate deploy
//
// On Vercel, set both in Project Settings → Environment Variables.

import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/moha_gaming_lab?schema=public",
  },
});
