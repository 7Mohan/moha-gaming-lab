import * as React from "react";
import { getAllGuides } from "@/lib/services/guide-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { ReviewQueue } from "@/components/admin/review/ReviewQueue";

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const allGuides = await getAllGuides();
  const reviewGuides = allGuides.filter((g) => g.status === "review");

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Review Queue" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Editorial Review Queue</span>
            {reviewGuides.length > 0 && (
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {reviewGuides.length} Pending
              </span>
            )}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Review submitted articles, inspect revisions, approve publication, or return with editorial change requests.
          </p>
        </div>
      </div>

      <ReviewQueue guides={reviewGuides} />
    </div>
  );
}
