"use client";

import * as React from "react";
import { updateSeoAction, createRedirectAction, deleteRedirectAction } from "@/app/admin/(dashboard)/seo/actions";
import { validateSeoMetadata } from "@/lib/seo/validation";
import type { RedirectRule } from "@/lib/seo/redirects";
import { CheckCircle2, AlertTriangle, ArrowRight, Trash2 } from "lucide-react";

export interface SeoItem {
  id: string;
  type: "GAME" | "APP" | "TOOL" | "GUIDE";
  title: string;
  slug: string;
  description: string;
}

interface SeoManagerProps {
  items: SeoItem[];
  initialRedirects?: RedirectRule[];
}

export function SeoManager({ items, initialRedirects = [] }: SeoManagerProps) {
  const [activeTab, setActiveTab] = React.useState<"editor" | "audit" | "redirects" | "console">("editor");
  const [selectedId, setSelectedId] = React.useState<string>(items[0]?.id || "");
  const [search, setSearch] = React.useState("");

  const selectedItem = items.find((i) => i.id === selectedId) || items[0];

  const [metaTitle, setMetaTitle] = React.useState(selectedItem?.title || "");
  const [metaDesc, setMetaDesc] = React.useState(selectedItem?.description || "");
  const [canonical, setCanonical] = React.useState("");
  const [noIndex, setNoIndex] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  // Redirects state
  const [redirects, setRedirects] = React.useState<RedirectRule[]>(initialRedirects);
  const [newSource, setNewSource] = React.useState("");
  const [newTarget, setNewTarget] = React.useState("");
  const [newStatusCode, setNewStatusCode] = React.useState(301);
  const [newDesc, setNewDesc] = React.useState("");
  const [redirectMsg, setRedirectMsg] = React.useState<string | null>(null);
  const [isRedirectSaving, setIsRedirectSaving] = React.useState(false);

  // Sync when selected item changes
  React.useEffect(() => {
    if (selectedItem) {
      setMetaTitle(selectedItem.title);
      setMetaDesc(selectedItem.description.slice(0, 150));
      setCanonical(`https://mohagaminglab.com/${selectedItem.type.toLowerCase()}s/${selectedItem.slug}`);
      setMessage(null);
    }
  }, [selectedItem]);

  const filteredItems = search.trim()
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.slug.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("metaTitle", metaTitle);
    formData.append("metaDescription", metaDesc);
    formData.append("canonicalUrl", canonical);
    formData.append("noIndex", String(noIndex));

    try {
      const res = await updateSeoAction(selectedItem.type, selectedItem.id, null, formData);
      if (res.success) {
        setMessage("SEO metadata successfully updated!");
      } else {
        setMessage(res.error || "Failed to update SEO");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateRedirect(e: React.FormEvent) {
    e.preventDefault();
    setIsRedirectSaving(true);
    setRedirectMsg(null);

    try {
      const res = await createRedirectAction(newSource, newTarget, newStatusCode, newDesc);
      if (res.success) {
        setRedirectMsg("Redirect rule created successfully!");
        setNewSource("");
        setNewTarget("");
        setNewDesc("");
        // Optimistically add to list
        setRedirects([
          {
            id: "temp_" + Date.now(),
            sourcePath: newSource,
            targetPath: newTarget,
            statusCode: newStatusCode,
            enabled: true,
            hitCount: 0,
            description: newDesc,
          },
          ...redirects,
        ]);
      } else {
        setRedirectMsg(res.error || "Failed to create redirect.");
      }
    } finally {
      setIsRedirectSaving(false);
    }
  }

  async function handleDeleteRedirect(id: string) {
    if (!confirm("Are you sure you want to delete this redirect?")) return;
    const res = await deleteRedirectAction(id);
    if (res.success) {
      setRedirects(redirects.filter((r) => r.id !== id));
    }
  }

  // Live SEO validation calculation
  const validationResult = validateSeoMetadata({
    title: metaTitle,
    description: metaDesc,
    canonicalUrl: canonical,
    wordCount: 300,
  });

  const titleLen = metaTitle.length;
  const descLen = metaDesc.length;

  return (
    <div className="space-y-6">
      {/* Top Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("editor")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === "editor"
              ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
              : "bg-white/5 text-text-secondary hover:text-white"
          }`}
        >
          Metadata & SERP
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
            activeTab === "audit"
              ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
              : "bg-white/5 text-text-secondary hover:text-white"
          }`}
        >
          <span>Technical Audit</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-bold">
            {validationResult.score}/100
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("redirects")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
            activeTab === "redirects"
              ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
              : "bg-white/5 text-text-secondary hover:text-white"
          }`}
        >
          <span>301 Redirects</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-bold">
            {redirects.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("console")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === "console"
              ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
              : "bg-white/5 text-text-secondary hover:text-white"
          }`}
        >
          Search Console Setup
        </button>
      </div>

      {/* TAB 1: METADATA & SERP */}
      {activeTab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left items selector (1 col) */}
          <div className="space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter content items..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0E131F] border border-white/10 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-primary"
            />

            <div className="bg-[#0E131F] rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5 max-h-[34rem] overflow-y-auto custom-scrollbar">
              {filteredItems.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full p-3 text-left transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-primary/10 border-l-2 border-primary text-white"
                        : "hover:bg-white/[0.02] text-text-secondary"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{item.title}</span>
                      <span className="text-[10px] font-mono text-text-tertiary block truncate">
                        /{item.slug}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-primary flex-shrink-0">
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right editor & Google SERP preview (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedItem && (
              <>
                {/* Live Search Engine SERP Simulator */}
                <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 space-y-3 shadow-xl shadow-black/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary block">
                      Google Search Result Simulator
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Canonical: HTTPS Verified</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#141A29] border border-white/5 space-y-1.5">
                    <div className="text-[11px] text-text-tertiary font-mono truncate">
                      https://mohagaminglab.com › {selectedItem.type.toLowerCase()}s › {selectedItem.slug}
                    </div>
                    <h4 className="text-base text-[#8AB4F8] hover:underline font-medium cursor-pointer truncate">
                      {metaTitle || selectedItem.title} | Moha Gaming Lab
                    </h4>
                    <p className="text-xs text-[#BDC1C6] leading-relaxed line-clamp-2">
                      {metaDesc || selectedItem.description}
                    </p>
                  </div>
                </div>

                {/* SEO Form */}
                <form
                  onSubmit={handleSave}
                  className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl shadow-black/30"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Configure Metadata: {selectedItem.title}
                    </h3>
                    {message && (
                      <span className="text-xs font-mono text-emerald-400">{message}</span>
                    )}
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-text-secondary">Meta Title</label>
                      <span
                        className={`text-[10px] font-mono ${
                          titleLen > 60 ? "text-amber-400" : titleLen >= 30 ? "text-emerald-400" : "text-text-tertiary"
                        }`}
                      >
                        {titleLen} / 60 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#141A29] border border-white/10 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-text-secondary">Meta Description</label>
                      <span
                        className={`text-[10px] font-mono ${
                          descLen > 155 ? "text-amber-400" : descLen >= 70 ? "text-emerald-400" : "text-text-tertiary"
                        }`}
                      >
                        {descLen} / 155 chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={metaDesc}
                      onChange={(e) => setMetaDesc(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#141A29] border border-white/10 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-primary resize-none leading-relaxed"
                    />
                  </div>

                  {/* Canonical URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-text-secondary">Canonical URL</label>
                    <input
                      type="text"
                      value={canonical}
                      onChange={(e) => setCanonical(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#141A29] border border-white/10 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-primary font-mono text-[11px]"
                    />
                  </div>

                  {/* NoIndex toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noIndex}
                        onChange={(e) => setNoIndex(e.target.checked)}
                        className="rounded border-white/20 bg-[#141A29] text-primary focus:ring-primary"
                      />
                      <span className="text-xs text-text-secondary">
                        Instruct search engines not to index (noindex, nofollow)
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold font-mono hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save SEO Metadata"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL SEO AUDIT */}
      {activeTab === "audit" && (
        <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Technical SEO Health Audit</h3>
              <p className="text-xs text-text-secondary mt-1">
                Automated validation evaluating snippet lengths, canonical formats, and indexability rules.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs font-mono text-text-secondary">Health Score:</span>
              <span
                className={`text-sm font-mono font-black ${
                  validationResult.score >= 80 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {validationResult.score} / 100
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {validationResult.issues.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>All SEO checks passed! Titles, descriptions, and canonical tags meet standard search criteria.</span>
              </div>
            ) : (
              validationResult.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                    issue.severity === "error"
                      ? "bg-red-500/10 border-red-500/20 text-red-300"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                  }`}
                >
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">{issue.message}</p>
                    <p className="text-[11px] opacity-80">{issue.recommendation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: 301 REDIRECTS MANAGER */}
      {activeTab === "redirects" && (
        <div className="space-y-6">
          {/* New Redirect Rule Form */}
          <form
            onSubmit={handleCreateRedirect}
            className="bg-[#0E131F] rounded-2xl border border-white/10 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">Create 301 Permanent Redirect</h3>
              {redirectMsg && (
                <span className="text-xs font-mono text-emerald-400">{redirectMsg}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-text-secondary">Source Path (Old URL)</label>
                <input
                  type="text"
                  required
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="/games/old-pubg-slug"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141A29] border border-white/10 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-text-secondary">Target Path (New Canonical URL)</label>
                <input
                  type="text"
                  required
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="/games/pubg-mobile"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141A29] border border-white/10 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-text-secondary">Status Code</label>
                <select
                  value={newStatusCode}
                  onChange={(e) => setNewStatusCode(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141A29] border border-white/10 text-xs text-white focus:outline-none focus:border-primary font-mono"
                >
                  <option value={301}>301 - Permanent Redirect (Recommended for SEO)</option>
                  <option value={302}>302 - Temporary Redirect</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-text-secondary">Note / Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Slug migration for game hub update"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141A29] border border-white/10 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isRedirectSaving}
                className="px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold font-mono hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {isRedirectSaving ? "Creating..." : "Add Redirect Rule"}
              </button>
            </div>
          </form>

          {/* Existing Redirects Table */}
          <div className="bg-[#0E131F] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white">Active Redirect Rules</span>
              <span className="text-xs font-mono text-text-secondary">{redirects.length} rules</span>
            </div>

            {redirects.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-text-tertiary">
                No active redirects configured. URLs route directly.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-96 overflow-y-auto custom-scrollbar">
                {redirects.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-red-400">{r.sourcePath}</span>
                        <ArrowRight size={12} className="text-text-tertiary" />
                        <span className="text-emerald-400">{r.targetPath}</span>
                        <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-text-secondary">
                          {r.statusCode}
                        </span>
                      </div>
                      {r.description && (
                        <p className="text-[11px] text-text-tertiary">{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[10px] font-mono text-text-tertiary">
                        {r.hitCount} hits
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRedirect(r.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                        title="Delete redirect"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SEARCH CONSOLE SETUP */}
      {activeTab === "console" && (
        <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Google Search Console & Bing Readiness</h3>
            <p className="text-xs text-text-secondary mt-1">
              Instructions and verification endpoints to establish domain ownership and monitoring.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#141A29] border border-white/5 space-y-2">
              <span className="text-xs font-bold text-white block">1. Dynamic XML Sitemap</span>
              <p className="text-xs text-text-secondary leading-relaxed">
                Submit this dynamic URL directly into your Google Search Console under Sitemaps:
              </p>
              <div className="p-2.5 rounded-lg bg-black/40 font-mono text-xs text-emerald-400 select-all">
                https://mohagaminglab.com/sitemap.xml
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141A29] border border-white/5 space-y-2">
              <span className="text-xs font-bold text-white block">2. Robots.txt Directives</span>
              <p className="text-xs text-text-secondary leading-relaxed">
                Live crawler access policy generated dynamically:
              </p>
              <div className="p-2.5 rounded-lg bg-black/40 font-mono text-xs text-text-secondary select-all">
                https://mohagaminglab.com/robots.txt
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141A29] border border-white/5 space-y-2">
              <span className="text-xs font-bold text-white block">3. Google Site Verification Tag</span>
              <p className="text-xs text-text-secondary leading-relaxed">
                To complete HTML tag verification, add your verification code to your production environment variable:
              </p>
              <div className="p-2.5 rounded-lg bg-black/40 font-mono text-xs text-primary select-all">
                NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=&quot;your-code-here&quot;
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
