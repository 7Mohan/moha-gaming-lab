"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createTagAction, deleteTagAction, mergeTagsAction } from "@/app/admin/(dashboard)/tags/actions";
import type { TagRecord } from "@/lib/repositories/types";

export function TagManager({ tags }: { tags: TagRecord[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Merge state
  const [mergeSource, setMergeSource] = React.useState<string>("");
  const [mergeDest, setMergeDest] = React.useState<string>("");
  const [isMerging, setIsMerging] = React.useState(false);

  // Normalization warning detector: checks if new tag slug is very similar to existing
  const nearDuplicate = React.useMemo(() => {
    if (!slug) return null;
    const clean = slug.replace(/-/g, "");
    return tags.find(
      (t) => t.slug !== slug && (t.slug.replace(/-/g, "") === clean || t.slug.includes(slug) || slug.includes(t.slug))
    );
  }, [slug, tags]);

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
    setSuccess(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);

    try {
      const res = await createTagAction(null, formData);
      if (res.success) {
        setName("");
        setSlug("");
        setSuccess("Tag registered successfully!");
        router.refresh();
      } else {
        setError(res.error || "Failed to create tag");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    setError(null);
    setSuccess(null);
    const res = await deleteTagAction(id);
    if (!res.success) {
      setError(res.error || "Failed to delete tag");
    } else {
      router.refresh();
    }
  }

  async function handleMerge(e: React.FormEvent) {
    e.preventDefault();
    if (!mergeSource || !mergeDest || mergeSource === mergeDest) {
      setError("Select two distinct tags to merge.");
      return;
    }
    if (!confirm(`Are you sure you want to merge #${mergeSource} into #${mergeDest}? All content referencing #${mergeSource} will be updated and #${mergeSource} will be deleted.`)) {
      return;
    }
    setIsMerging(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await mergeTagsAction(mergeSource, mergeDest);
      if (res.success) {
        setSuccess(`Successfully merged #${mergeSource} into #${mergeDest} (${res.modifiedCount ?? 0} items updated).`);
        setMergeSource("");
        setMergeDest("");
        router.refresh();
      } else {
        setError(res.error || "Failed to merge tags");
      }
    } finally {
      setIsMerging(false);
    }
  }

  const filtered = search.trim()
    ? tags.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.slug.toLowerCase().includes(search.toLowerCase())
      )
    : tags;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left (2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search */}
        <div className="bg-[#0E131F] p-3 rounded-2xl border border-white/10 flex items-center justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags..."
            className="w-full max-w-sm px-3 py-1.5 rounded-xl bg-[#141A29] border border-white/10 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-primary font-mono"
          />
          <span className="text-xs font-mono text-text-tertiary">
            {filtered.length} of {tags.length} tags
          </span>
        </div>

        {/* Tag Cloud & Table */}
        <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 shadow-xl shadow-black/30">
          <div className="flex flex-wrap gap-2">
            {filtered.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-2 py-1 px-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-xs font-mono text-white transition-colors"
              >
                <span>#{tag.slug}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(tag.id)}
                  className="text-text-tertiary hover:text-rose-400 text-sm leading-none"
                  title="Delete tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Inline Create Form & Merge Form */}
      <div className="space-y-6">
        <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl shadow-black/30 h-fit">
          <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">
            Register New Tag
          </h3>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              {success}
            </div>
          )}

          {nearDuplicate && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
              <strong>Warning: Near-Duplicate Detected</strong>
              <p className="mt-1 text-[11px] text-amber-400/90">
                A similar tag exists: <code>#{nearDuplicate.slug}</code>. Consider reusing it to avoid tag fragmentation.
              </p>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block text-text-tertiary mb-1 font-mono uppercase text-[10px]" htmlFor="tag-name">
                Tag Display Name
              </label>
              <input
                id="tag-name"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Vulkan Renderer"
                className="w-full px-3 py-2 rounded-xl bg-[#141A29] border border-white/10 text-white placeholder-text-tertiary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-text-tertiary mb-1 font-mono uppercase text-[10px]" htmlFor="tag-slug">
                Slug Identifier
              </label>
              <input
                id="tag-slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g. vulkan-renderer"
                className="w-full px-3 py-2 rounded-xl bg-[#141A29] border border-white/10 text-white placeholder-text-tertiary focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold font-mono transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Adding..." : "+ Create Tag"}
            </button>
          </form>
        </div>

        {/* Merge Tags Card */}
        <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl shadow-black/30 h-fit">
          <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">
            Merge & Consolidate Tags
          </h3>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Replace a redundant or misspelled tag across all games, apps, tools, and guides, then automatically remove the source tag.
          </p>

          <form onSubmit={handleMerge} className="space-y-4 text-xs">
            <div>
              <label className="block text-text-tertiary mb-1 font-mono uppercase text-[10px]" htmlFor="source-tag">
                Source Tag (To Delete)
              </label>
              <select
                id="source-tag"
                required
                value={mergeSource}
                onChange={(e) => setMergeSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141A29] border border-white/10 text-white focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="">-- Select Source Tag --</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.slug} disabled={t.slug === mergeDest}>
                    #{t.slug} ({t.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text-tertiary mb-1 font-mono uppercase text-[10px]" htmlFor="dest-tag">
                Target Tag (To Keep)
              </label>
              <select
                id="dest-tag"
                required
                value={mergeDest}
                onChange={(e) => setMergeDest(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141A29] border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="">-- Select Target Tag --</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.slug} disabled={t.slug === mergeSource}>
                    #{t.slug} ({t.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isMerging || !mergeSource || !mergeDest || mergeSource === mergeDest}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isMerging ? "Merging Content..." : "Merge Into Target Tag"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
