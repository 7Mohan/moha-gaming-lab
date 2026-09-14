"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onStay,
  onLeave,
}: UnsavedChangesDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-[#0E131F] border border-amber-500/30 p-6 text-center shadow-2xl shadow-black/80 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white">You have unsaved changes</h3>
          <p className="text-xs text-text-secondary">
            Leave without saving? Any unsaved edits will be discarded.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onStay}
            className="py-2 px-4 rounded-xl bg-primary text-black font-bold text-xs font-mono hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs hover:bg-white/10 transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
