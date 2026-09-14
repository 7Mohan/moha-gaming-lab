"use client";

import * as React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isSubmitting = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  const btnColors = {
    danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20",
    warning: "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20",
    primary: "bg-primary hover:bg-primary/90 text-black shadow-primary/20",
  };

  const iconColors = {
    danger: "text-rose-400 bg-rose-500/15 border-rose-500/30",
    warning: "text-amber-400 bg-amber-500/15 border-amber-500/30",
    primary: "text-primary bg-primary/15 border-primary/30",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-[#0E131F] border border-white/15 p-6 shadow-2xl shadow-black/80 space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${
              iconColors[variant]
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="dialog-title" className="text-base font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
              btnColors[variant]
            }`}
          >
            {isSubmitting && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
