import * as React from "react";
import { getSession } from "@/lib/auth/session";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { MonetizationClient } from "@/components/admin/monetization/MonetizationClient";
import { getMonetizationStateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MonetizationPage() {
  const session = await getSession();
  const state = await getMonetizationStateAction();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Monetization & Ads" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Monetization & Ads Architecture
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              Phase 13
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Manage privacy-conscious ad placements, provider engines, safe affiliate links, and CLS limits.
          </p>
        </div>
      </div>

      <MonetizationClient
        initialPlacements={state.placements}
        initialProvider={state.globalProvider}
        initialTestMode={state.isTestMode}
        initialAffiliates={state.affiliateLinks}
        userRole={session?.role || "AUTHOR"}
      />
    </div>
  );
}
