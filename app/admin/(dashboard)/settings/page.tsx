import * as React from "react";
import { revalidatePath } from "next/cache";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { hasDatabaseUrl } from "@/lib/env";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requirePermission("manageSettings");
  const isDb = hasDatabaseUrl();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <Breadcrumb items={[{ label: "Settings" }]} />
        <h1 className="text-2xl font-black text-white tracking-tight">
          System Diagnostics & Settings
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Runtime specifications, database connection pool, authentication security, and cache controls.
        </p>
      </div>

      {/* System Specifications Card */}
      <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl shadow-black/30">
        <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">
          Runtime Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-text-tertiary block text-[10px] uppercase">Node Environment</span>
            <span className="text-white font-semibold text-sm mt-0.5 block">
              {process.env.NODE_ENV || "development"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-text-tertiary block text-[10px] uppercase">Framework Engine</span>
            <span className="text-white font-semibold text-sm mt-0.5 block">
              Next.js 15 (App Router + Turbopack)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-text-tertiary block text-[10px] uppercase">Database Connectivity</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isDb ? "bg-emerald-400" : "bg-cyan-400"}`} />
              <span className="text-white font-semibold">
                {isDb ? "PostgreSQL (Prisma Client Active)" : "Static Repository Mode (Zero Latency)"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-text-tertiary block text-[10px] uppercase">Auth Mechanism</span>
            <span className="text-white font-semibold text-sm mt-0.5 block">
              PBKDF2-SHA256 + HMAC-Signed Cookie
            </span>
          </div>
        </div>
      </div>

      {/* Current Operator Session */}
      <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl shadow-black/30">
        <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">
          Current Administrative Session
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-text-tertiary block text-[10px] uppercase">Operator Name</span>
            <span className="text-white font-bold mt-1 block">{session.name}</span>
          </div>
          <div>
            <span className="text-text-tertiary block text-[10px] uppercase">Email Identity</span>
            <span className="text-white mt-1 block">{session.email}</span>
          </div>
          <div>
            <span className="text-text-tertiary block text-[10px] uppercase">Assigned RBAC Role</span>
            <span className="text-primary font-bold mt-1 block">{session.role}</span>
          </div>
        </div>
      </div>

      {/* Cache Revalidation Action */}
      <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl shadow-black/30">
        <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">
          Cache Invalidation
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Force refresh all static edge caches and rebuild all public route payloads (/games, /apps, /tools, /guides).
        </p>

        <form
          action={async () => {
            "use server";
            revalidatePath("/games");
            revalidatePath("/apps");
            revalidatePath("/tools");
            revalidatePath("/guides");
            revalidatePath("/");
            revalidatePath("/admin/settings");
          }}
        >
          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-colors cursor-pointer"
          >
            Revalidate All Public Pages Cache
          </button>
        </form>
      </div>
    </div>
  );
}
