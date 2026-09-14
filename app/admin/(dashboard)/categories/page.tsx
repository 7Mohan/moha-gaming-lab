import * as React from "react";
import { getCategories } from "@/lib/services/category-service";
import { Breadcrumb } from "@/components/admin/ui/Breadcrumb";
import { CategoryManager } from "@/components/admin/categories/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Categories" }]} />
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Category Taxonomy
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Define global classification tags for games, apps, tools, and technical guides.
        </p>
      </div>

      <CategoryManager categories={categories} />
    </div>
  );
}
