import * as React from "react";
import { requirePermission } from "@/lib/auth/guards";
import { getAnalyticsSummary } from "@/lib/analytics/service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { AnalyticsDashboardClient } from "@/components/admin/analytics/AnalyticsDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requirePermission("read");
  const summary = await getAnalyticsSummary();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Analytics & Growth Infrastructure" }]} />

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Growth & Traffic Analytics
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Real-time measurement of pageviews, search queries, tool diagnostic runs, download funnels, and Core Web Vitals.
        </p>
      </div>

      <AnalyticsDashboardClient data={summary} />
    </div>
  );
}
