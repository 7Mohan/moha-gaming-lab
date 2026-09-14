"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, deleteCategoryAction } from "@/app/admin/(dashboard)/categories/actions";
import type { CategoryRecord } from "@/lib/repositories/types";

export function CategoryManager({ categories }: { categories: CategoryRecord[] }) {
  const router = useRouter();
  const [filterSection, setFilterSection] = React.useState<string>("ALL");
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [sectionType, setSectionType] = React.useState<"GAME" | "APP" | "TOOL" | "GUIDE">("GAME");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    setSlug(
      e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("sectionType", sectionType);

    try {
      const res = await createCategoryAction(null, formData);
      if (res.success) {
        setName("");
        setSlug("");
        router.refresh();
      } else {
        setError(res.error || "Failed to create category");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setError(null);
    const res = await deleteCategoryAction(id);
    if (!res.success) {
      setError(res.error || "Failed to delete category");
    } else {
      router.refresh();
    }
  }

  const filtered = filterSection === "ALL"
    ? categories
    : categories.filter((c) => c.sectionType === filterSection);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List (2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <strong>Category Protected</strong>
              <p className="mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-text-tertiary hover:text-white text-base leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Section Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {["ALL", "GAME", "APP", "TOOL", "GUIDE"].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setFilterSection(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors ${
                filterSection === sec
                  ? "bg-primary text-black font-bold"
                  : "bg-white/5 text-text-secondary hover:text-white border border-white/10"
              }`}
            >
              {sec} ({sec === "ALL" ? categories.length : categories.filter((c) => c.sectionType === sec).length})
            </button>
          ))}
        </div>

        {/* Categories Table */}
        <div className="bg-[#0E131F] rounded-2xl border border-white/10 overflow-hidden shadow-xl shadow-black/30">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-text-tertiary">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-secondary">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">{cat.name}</td>
                  <td className="py-3 px-4 text-text-tertiary">/{cat.slug}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-primary">
                      {cat.sectionType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      className="p-1 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                      title="Delete category"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Create Form (1 col) */}
      <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl shadow-black/30 h-fit">
        <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">
          Create New Category
        </h3>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-text-tertiary mb-1 font-mono uppercase text-[10px]" htmlFor="cat-name">
              Category Name
            </label>
            <input
              id="cat-name"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Battle Royale"
              className="w-full px-3 py-2 rounded-xl bg-[#141A29] border border-white/10 text-white placeholder-text-tertiary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-text-tertiary mb-1 font-mono uppercase text-[10px]" htmlFor="cat-slug">
              Slug
            </label>
            <input
              id="cat-slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. battle-royale"
              className="w-full px-3 py-2 rounded-xl bg-[#141A29] border border-white/10 text-white placeholder-text-tertiary focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-text-tertiary mb-1 font-mono uppercase text-[10px]" htmlFor="cat-section">
              Section Scope
            </label>
            <select
              id="cat-section"
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value as "GAME" | "APP" | "TOOL" | "GUIDE")}
              className="w-full px-3 py-2 rounded-xl bg-[#141A29] border border-white/10 text-white focus:outline-none focus:border-primary"
            >
              <option value="GAME">Games Library</option>
              <option value="APP">Android Apps Hub</option>
              <option value="TOOL">Diagnostic Tools</option>
              <option value="GUIDE">Guides & Tutorials</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold font-mono transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Adding..." : "+ Create Category"}
          </button>
        </form>
      </div>
    </div>
  );
}
