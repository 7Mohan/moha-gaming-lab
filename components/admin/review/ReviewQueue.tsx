"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { RequestChangesDialog } from "./RequestChangesDialog";
import { approveReviewAction, requestChangesAction } from "@/app/admin/(dashboard)/guides/actions";
import type { Guide } from "@/types/guide";

interface ReviewQueueProps {
  guides: Guide[];
}

export function ReviewQueue({ guides }: ReviewQueueProps) {
  const router = useRouter();
  const [selectedSection, setSelectedSection] = React.useState<"ALL" | "GUIDE" | "APP" | "GAME" | "TOOL">("ALL");
  const [activeItem, setActiveItem] = React.useState<{ id: string; title: string } | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function handleApprove(guide: Guide) {
    if (!confirm(`Approve and publish "${guide.title}" to the live site?`)) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await approveReviewAction(guide.id);
      if (res.success) {
        setSuccess(`"${guide.title}" has been approved and published to the live site!`);
        router.refresh();
      } else {
        setError(res.error || "Failed to approve submission");
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmRequestChanges(note: string) {
    if (!activeItem) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await requestChangesAction(activeItem.id, note);
      if (res.success) {
        setSuccess(`Changes requested for "${activeItem.title}". The guide has returned to Draft state.`);
        setActiveItem(null);
        router.refresh();
      } else {
        setError(res.error || "Failed to request changes");
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setIsProcessing(false);
    }
  }

  // Filter items based on selected section tab
  const items = selectedSection === "ALL" || selectedSection === "GUIDE" ? guides : [];

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start justify-between gap-3">
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} className="text-sm font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start justify-between gap-3">
          <p>{success}</p>
          <button type="button" onClick={() => setSuccess(null)} className="text-sm font-bold">×</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedSection("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 ${
            selectedSection === "ALL"
              ? "bg-primary text-black font-bold"
              : "bg-white/5 text-text-secondary hover:text-white border border-white/10"
          }`}
        >
          <span>All Submissions</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{guides.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSection("GUIDE")}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 ${
            selectedSection === "GUIDE"
              ? "bg-primary text-black font-bold"
              : "bg-white/5 text-text-secondary hover:text-white border border-white/10"
          }`}
        >
          <span>Guides &amp; Tutorials</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{guides.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSection("APP")}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 ${
            selectedSection === "APP"
              ? "bg-primary text-black font-bold"
              : "bg-white/5 text-text-secondary hover:text-white border border-white/10"
          }`}
        >
          <span>Apps</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">0</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSection("GAME")}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 ${
            selectedSection === "GAME"
              ? "bg-primary text-black font-bold"
              : "bg-white/5 text-text-secondary hover:text-white border border-white/10"
          }`}
        >
          <span>Games</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">0</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSection("TOOL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 ${
            selectedSection === "TOOL"
              ? "bg-primary text-black font-bold"
              : "bg-white/5 text-text-secondary hover:text-white border border-white/10"
          }`}
        >
          <span>Diagnostic Tools</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">0</span>
        </button>
      </div>

      {/* Queue Items */}
      {items.length === 0 ? (
        <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-12 text-center shadow-xl shadow-black/20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white">Editorial Review Queue Clean</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            No submissions are currently waiting for editorial approval. All content items have been processed or published.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((guide) => (
            <div
              key={guide.id}
              className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 shadow-xl shadow-black/20 hover:border-white/20 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      {guide.contentType || "Guide"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-text-secondary border border-white/10">
                      {guide.category}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-text-secondary border border-white/10">
                      {guide.difficulty}
                    </span>
                    <StatusBadge status="REVIEW" />
                  </div>

                  <h2 className="text-base font-bold text-white hover:text-primary transition-colors">
                    <Link href={`/admin/guides/${guide.id}`}>
                      {guide.title}
                    </Link>
                  </h2>
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {guide.excerpt || guide.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start">
                  <Link
                    href={`/guides/${guide.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-text-secondary hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Preview</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>

                  <Link
                    href={`/admin/guides/${guide.id}`}
                    className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-text-secondary hover:text-white transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>

              {/* Author, reading time, and metadata row */}
              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-text-tertiary">
                <div className="flex items-center gap-4 flex-wrap">
                  <span>
                    Author: <strong className="text-white">{guide.author?.name || "Anonymous"}</strong>
                    {guide.author?.role && <span className="text-text-tertiary"> ({guide.author.role})</span>}
                  </span>
                  <span>Est: <strong className="text-white">{guide.readingTimeMinutes} min</strong> read</span>
                  <span>Sections: <strong className="text-white">{guide.sections?.length || 0}</strong></span>
                  {guide.updatedAt && (
                    <span>Submitted: <strong className="text-white">{new Date(guide.updatedAt).toLocaleDateString()}</strong></span>
                  )}
                </div>

                {/* Workflow Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setActiveItem({ id: guide.id, title: guide.title })}
                    className="py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Request Changes</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(guide)}
                    className="py-1.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Approve &amp; Publish</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Changes Modal */}
      <RequestChangesDialog
        isOpen={!!activeItem}
        itemTitle={activeItem?.title || ""}
        isSubmitting={isProcessing}
        onConfirm={handleConfirmRequestChanges}
        onCancel={() => setActiveItem(null)}
      />
    </div>
  );
}
