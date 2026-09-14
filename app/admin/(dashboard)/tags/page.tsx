import * as React from "react";
import { getAllTags } from "@/lib/services/tag-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { TagManager } from "@/components/admin/tags/TagManager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await getAllTags();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Tags" }]} />
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Taxonomy Tags
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Normalize, inspect, and organize tags across all ecosystem entities.
        </p>
      </div>

      <TagManager tags={tags} />
    </div>
  );
}
