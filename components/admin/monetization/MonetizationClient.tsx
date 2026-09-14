"use client";

import * as React from "react";
import type { AdPlacementConfig, AdProviderType } from "@/lib/monetization/types";
import { FORMAT_DIMENSIONS } from "@/lib/monetization/config";
import {
  togglePlacementAction,
  updateGlobalAdConfigAction,
  createAffiliateLinkAction,
} from "@/app/admin/(dashboard)/monetization/actions";
import { Eye, Shield, Link2, Plus, Check, Loader2 } from "lucide-react";

interface MonetizationClientProps {
  initialPlacements: AdPlacementConfig[];
  initialProvider: AdProviderType;
  initialTestMode: boolean;
  initialAffiliates: Array<{
    id: string;
    slug: string;
    name: string;
    destinationUrl: string;
    provider?: string | null;
    enabled: boolean;
    clickCount: number;
  }>;
  userRole: "ADMIN" | "EDITOR" | "AUTHOR";
}

export function MonetizationClient({
  initialPlacements,
  initialProvider,
  initialTestMode,
  initialAffiliates,
  userRole,
}: MonetizationClientProps) {
  const [placements, setPlacements] = React.useState(initialPlacements);
  const [provider, setProvider] = React.useState<AdProviderType>(initialProvider);
  const [isTestMode, setIsTestMode] = React.useState(initialTestMode);
  const [affiliates, setAffiliates] = React.useState(initialAffiliates);

  const [previewPlacement, setPreviewPlacement] = React.useState<AdPlacementConfig | null>(null);
  const [previewDevice, setPreviewDevice] = React.useState<"DESKTOP" | "TABLET" | "MOBILE">("DESKTOP");

  const [togglingKey, setTogglingKey] = React.useState<string | null>(null);
  const [isSavingGlobal, setIsSavingGlobal] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null);

  const isAdmin = userRole === "ADMIN";
  const canEdit = userRole === "ADMIN" || userRole === "EDITOR";

  const activeCount = placements.filter((p) => p.enabled).length;

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    if (!canEdit) return;
    setTogglingKey(key);
    const nextEnabled = !currentEnabled;

    setPlacements((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: nextEnabled } : p))
    );

    const res = await togglePlacementAction(key, nextEnabled);
    setTogglingKey(null);

    if (!res.success) {
      // Revert
      setPlacements((prev) =>
        prev.map((p) => (p.key === key ? { ...p, enabled: currentEnabled } : p))
      );
      setFeedbackMsg(`Failed to toggle ${key}: ${res.error}`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleSaveGlobalConfig = async () => {
    if (!isAdmin) return;
    setIsSavingGlobal(true);
    const res = await updateGlobalAdConfigAction(provider, isTestMode);
    setIsSavingGlobal(false);

    if (res.success) {
      setFeedbackMsg("Global ad configuration saved successfully.");
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setFeedbackMsg(`Failed to save: ${res.error}`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleCreateAffiliate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await createAffiliateLinkAction(formData);
    if (res.success) {
      setFeedbackMsg("Affiliate link created successfully.");
      form.reset();
      // Optimistic append
      const slug = (formData.get("slug") as string).toLowerCase().trim();
      const name = (formData.get("name") as string).trim();
      const destinationUrl = (formData.get("destinationUrl") as string).trim();
      setAffiliates((prev) => [
        {
          id: `aff-${Date.now()}`,
          slug,
          name,
          destinationUrl,
          provider: "Custom",
          enabled: true,
          clickCount: 0,
        },
        ...prev,
      ]);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setFeedbackMsg(`Failed to create affiliate link: ${res.error}`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-mono text-xs flex items-center gap-2">
          <Check size={14} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-bg-surface border border-border-default space-y-1">
          <span className="text-2xs font-mono text-text-muted uppercase">Active Placements</span>
          <p className="text-2xl font-bold font-mono text-accent">
            {activeCount} <span className="text-sm font-normal text-text-muted">/ {placements.length}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-bg-surface border border-border-default space-y-1">
          <span className="text-2xs font-mono text-text-muted uppercase">Active Provider</span>
          <p className="text-sm font-bold font-mono text-white truncate">
            {provider}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-bg-surface border border-border-default space-y-1">
          <span className="text-2xs font-mono text-text-muted uppercase">Test Mode</span>
          <p className="text-sm font-bold font-mono text-accent flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isTestMode ? "bg-amber-400" : "bg-emerald-500"}`} />
            <span>{isTestMode ? "Enabled (Placeholders)" : "Live (Production)"}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-bg-surface border border-border-default space-y-1">
          <span className="text-2xs font-mono text-text-muted uppercase">Affiliate Links</span>
          <p className="text-2xl font-bold font-mono text-white">
            {affiliates.length}
          </p>
        </div>
      </div>

      {/* Global Provider Settings (Admin Only) */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border-default space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield size={16} className="text-accent" />
              <span>Global Provider Configuration</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Switch ad delivery engine or toggle test placeholder mode. Requires SuperAdmin permission.
            </p>
          </div>

          {isAdmin ? (
            <button
              type="button"
              onClick={handleSaveGlobalConfig}
              disabled={isSavingGlobal}
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-black font-mono text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isSavingGlobal ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          ) : (
            <span className="text-2xs font-mono text-text-muted px-2 py-1 rounded bg-bg-elevated border border-border-subtle">
              Admin Edit Restricted
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mono-provider" className="block text-xs font-mono text-text-secondary mb-1">
              Active Ad Provider
            </label>
            <select
              id="mono-provider"
              disabled={!isAdmin}
              value={provider}
              onChange={(e) => setProvider(e.target.value as AdProviderType)}
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-white text-xs font-mono focus:border-accent outline-none disabled:opacity-50"
            >
              <option value="TEST_PLACEHOLDER">Test Mode / Placeholder (Recommended)</option>
              <option value="ADSENSE">Google AdSense</option>
              <option value="DIRECT_SPONSOR">Direct Sponsor / Partner Card</option>
              <option value="AFFILIATE">Affiliate Network</option>
            </select>
            <p className="text-[10px] text-text-muted mt-1 font-mono">
              Test mode renders accessible layout outlines without external script calls.
            </p>
          </div>

          <div>
            <label htmlFor="mono-test-mode" className="block text-xs font-mono text-text-secondary mb-1">
              Test Mode Override
            </label>
            <select
              id="mono-test-mode"
              disabled={!isAdmin}
              value={isTestMode ? "true" : "false"}
              onChange={(e) => setIsTestMode(e.target.value === "true")}
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-white text-xs font-mono focus:border-accent outline-none disabled:opacity-50"
            >
              <option value="true">Active (Render preview boxes)</option>
              <option value="false">Production (Render live third-party tags)</option>
            </select>
            <p className="text-[10px] text-text-muted mt-1 font-mono">
              Never generates clicks or impressions while test mode is enabled.
            </p>
          </div>
        </div>
      </div>

      {/* Ad Placements Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Approved Ad Placements</h2>
            <p className="text-xs text-text-muted">
              Pre-approved non-deceptive placements. Toggling instantly takes effect on public pages.
            </p>
          </div>
        </div>

        <div className="border border-border-default rounded-xl overflow-hidden bg-bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bg-elevated border-b border-border-subtle text-text-muted uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Placement</th>
                  <th className="py-3 px-4">Page Target</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Min Height (CLS)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {placements.map((p) => {
                  const dims = FORMAT_DIMENSIONS[p.format] || FORMAT_DIMENSIONS.RESPONSIVE;
                  const isToggling = togglingKey === p.key;

                  return (
                    <tr key={p.key} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-text-muted font-normal">{p.key}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-bg-elevated text-text-secondary text-[10px]">
                          {p.pageType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{p.format}</td>
                      <td className="py-3 px-4 text-text-muted">{dims.minHeight}px</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          disabled={!canEdit || isToggling}
                          onClick={() => handleToggle(p.key, p.enabled)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            p.enabled
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {isToggling ? "Saving..." : p.enabled ? "ACTIVE" : "DISABLED"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setPreviewPlacement(p)}
                          className="px-2.5 py-1 rounded-lg bg-bg-elevated hover:bg-bg-overlay text-text-secondary hover:text-white transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Preview</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Affiliate Links Management */}
      <div className="space-y-4 pt-4 border-t border-border-subtle">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Link2 size={16} className="text-accent" />
            <span>Affiliate & Monetization Links (/api/go/[slug])</span>
          </h2>
          <p className="text-xs text-text-muted">
            All outbound affiliate links are routed through our open-redirect-proof gateway.
          </p>
        </div>

        {canEdit && (
          <form onSubmit={handleCreateAffiliate} className="p-4 rounded-xl bg-bg-surface border border-border-default space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add New Affiliate Link</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <input
                  name="name"
                  required
                  placeholder="Link Name (e.g. Phone Cooler)"
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-white placeholder-text-muted outline-none focus:border-accent font-mono"
                />
              </div>
              <div>
                <input
                  name="slug"
                  required
                  placeholder="Slug (e.g. cooler-pro)"
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-white placeholder-text-muted outline-none focus:border-accent font-mono"
                />
              </div>
              <div>
                <input
                  name="destinationUrl"
                  type="url"
                  required
                  placeholder="Destination https://..."
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-white placeholder-text-muted outline-none focus:border-accent font-mono"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-accent hover:bg-accent/90 text-black font-mono text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Register Link</span>
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="border border-border-default rounded-xl overflow-hidden bg-bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bg-elevated border-b border-border-subtle text-text-muted uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Name & Slug</th>
                  <th className="py-3 px-4">Gateway Endpoint</th>
                  <th className="py-3 px-4">Target Destination</th>
                  <th className="py-3 px-4 text-right">Click Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {affiliates.map((aff) => (
                  <tr key={aff.slug} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-semibold text-white">
                      <div>{aff.name}</div>
                      <div className="text-[10px] text-text-muted font-normal">{aff.slug}</div>
                    </td>
                    <td className="py-3 px-4 text-accent">/api/go/{aff.slug}</td>
                    <td className="py-3 px-4 text-text-secondary truncate max-w-xs">{aff.destinationUrl}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">{aff.clickCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Placement Preview Modal */}
      {previewPlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-bg-surface border border-border-default shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  Ad Slot Preview: {previewPlacement.name}
                </h3>
                <p className="text-2xs text-text-muted font-mono">
                  Format: {previewPlacement.format} • Min Height: {FORMAT_DIMENSIONS[previewPlacement.format].minHeight}px
                </p>
              </div>

              {/* Viewport switch */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-elevated border border-border-subtle text-xs font-mono">
                {(["DESKTOP", "TABLET", "MOBILE"] as const).map((dev) => (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => setPreviewDevice(dev)}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                      previewDevice === dev ? "bg-accent text-black font-bold" : "text-text-muted"
                    }`}
                  >
                    {dev}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Viewport Frame */}
            <div className="p-4 rounded-xl bg-bg-base border border-border-default flex justify-center items-center overflow-auto min-h-[300px]">
              <div
                className="w-full transition-all duration-300 flex justify-center"
                style={{
                  maxWidth:
                    previewDevice === "MOBILE"
                      ? "340px"
                      : previewDevice === "TABLET"
                      ? "600px"
                      : "100%",
                }}
              >
                <div
                  className="w-full p-4 rounded-xl border border-dashed border-accent/40 bg-accent/5 flex flex-col items-center justify-center gap-2 text-center"
                  style={{ minHeight: `${FORMAT_DIMENSIONS[previewPlacement.format].minHeight}px` }}
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
                    Advertisement
                  </span>
                  <p className="text-xs font-mono font-bold text-white">
                    {previewPlacement.name} ({previewPlacement.format})
                  </p>
                  <span className="text-[10px] font-mono text-accent">
                    Safe Non-Deceptive Slot
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewPlacement(null)}
                className="px-4 py-2 rounded-xl bg-bg-elevated hover:bg-bg-overlay text-white font-mono text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
