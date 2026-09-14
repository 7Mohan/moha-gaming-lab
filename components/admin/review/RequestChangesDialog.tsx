"use client";

import * as React from "react";
import { FormLabel, FormTextarea, FormHelperText } from "@/components/admin/ui/FormField";

interface RequestChangesDialogProps {
  isOpen: boolean;
  itemTitle: string;
  isSubmitting: boolean;
  onConfirm: (note: string) => Promise<void>;
  onCancel: () => void;
}

export function RequestChangesDialog({
  isOpen,
  itemTitle,
  isSubmitting,
  onConfirm,
  onCancel,
}: RequestChangesDialogProps) {
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = note.trim();
    if (trimmed.length < 10) {
      setError("Please provide a detailed editorial note of at least 10 characters.");
      return;
    }
    setError(null);
    await onConfirm(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#0E131F] border border-amber-500/30 p-6 shadow-2xl shadow-black/80 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              Request Editorial Changes
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Provide actionable feedback for &ldquo;<span className="text-white font-medium">{itemTitle}</span>&rdquo;.
              The submission will return to Draft state with your note attached.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-text-tertiary hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FormLabel htmlFor="editorial-note" required>
              Editorial Note &amp; Required Revisions
            </FormLabel>
            <FormTextarea
              id="editorial-note"
              required
              rows={4}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error && e.target.value.trim().length >= 10) setError(null);
              }}
              placeholder="e.g. Please clarify step 3 regarding Vulkan shader caching, verify the benchmark numbers for 120Hz mode, and add a caution note on thermal thresholds..."
            />
            <FormHelperText>
              Minimum 10 characters required. The author will see this note on their edit screen.
            </FormHelperText>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || note.trim().length < 10}
              className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Returning..." : "Send Back for Revision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
