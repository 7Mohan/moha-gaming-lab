"use client";

import * as React from "react";
import { verifyReleaseAction, deprecateReleaseAction } from "@/app/admin/(dashboard)/apps/actions";

interface VerifyReleaseDialogProps {
  isOpen: boolean;
  appSlug: string;
  releaseVersion: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function VerifyReleaseDialog({
  isOpen,
  appSlug,
  releaseVersion,
  onClose,
  onSuccess,
}: VerifyReleaseDialogProps) {
  const [basis, setBasis] = React.useState(
    "Tested on Pixel 7 (Android 14). SHA-256 matched official build. VirusTotal 0/72 clean."
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!basis.trim() || basis.trim().length < 10) {
      setError("Please document verification evidence (minimum 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await verifyReleaseAction(appSlug, releaseVersion, basis.trim());
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "Failed to verify release");
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0E131F] border border-emerald-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-emerald-950/40">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Verify Release v{releaseVersion}</h3>
              <p className="text-xs text-text-secondary">Record explicit verification basis for public download safety.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-white text-xs font-mono p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold text-text-secondary uppercase mb-2">
              Verification Basis & Testing Evidence <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={basis}
              onChange={(e) => setBasis(e.target.value)}
              placeholder="e.g. Tested on Pixel 7 (Android 14). Package signature verified against developer PGP key. VirusTotal report 0/72 engines clean."
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-text-tertiary focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
            <p className="text-[11px] text-text-tertiary mt-1">
              This explanation will be logged in the audit trail and displayed as public verification evidence.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-black bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-black" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Confirm Verification</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RevokeReleaseDialogProps {
  isOpen: boolean;
  appSlug: string;
  releaseVersion: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RevokeReleaseDialog({
  isOpen,
  appSlug,
  releaseVersion,
  onClose,
  onSuccess,
}: RevokeReleaseDialogProps) {
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Please provide a reason for deprecating this release (minimum 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await deprecateReleaseAction(appSlug, releaseVersion, reason.trim());
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "Failed to deprecate release");
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0E131F] border border-amber-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-amber-950/40">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Deprecate Release v{releaseVersion}</h3>
              <p className="text-xs text-text-secondary">Revoke verified download status with an explanation.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-white text-xs font-mono p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold text-text-secondary uppercase mb-2">
              Reason for Deprecation <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Critical security vulnerability identified in upstream library. Users advised to upgrade."
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-text-tertiary focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-black bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? "Updating..." : "Confirm Deprecation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
