"use client";

import * as React from "react";
import Link from "next/link";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";
import { StatusBadge, type ContentStatus } from "./StatusBadge";

interface AdminFormProps {
  title: string;
  subtitle?: string;
  backHref: string;
  breadcrumbs: BreadcrumbItem[];
  status?: ContentStatus;
  isSubmitting?: boolean;
  isDirty?: boolean;
  error?: string | null;
  successMessage?: string | null;
  actions?: React.ReactNode;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function AdminForm({
  title,
  subtitle,
  backHref,
  breadcrumbs,
  status,
  isSubmitting: _isSubmitting = false,
  isDirty = false,
  error,
  successMessage,
  actions,
  children,
  onSubmit,
}: AdminFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-20">
      {/* Top Breadcrumb & Header */}
      <div>
        <Breadcrumb items={breadcrumbs} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-text-tertiary hover:text-white transition-colors flex-shrink-0"
              title="Go back"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {title}
                </h1>
                {status && <StatusBadge status={status} size="md" />}
                {isDirty && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Unsaved
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {actions}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
          <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 font-mono">
            <strong className="font-bold block mb-0.5">Validation / Server Error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 font-mono">
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-6">{children}</div>
    </form>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl shadow-black/30">
      <div className="border-b border-white/5 pb-3">
        <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
        {description && <p className="text-xs text-text-tertiary mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
