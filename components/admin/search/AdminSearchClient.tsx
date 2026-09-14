"use client";

import * as React from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { adminSearchAction, type AdminSearchResultItem } from "@/app/admin/(dashboard)/search/actions";

export function AdminSearchClient() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AdminSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<string>("ALL");

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await adminSearchAction(trimmed);
        setResults(res);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = selectedType === "ALL"
    ? results
    : results.filter((r) => r.type.toUpperCase() === selectedType);

  const typeIcons: Record<string, React.ReactNode> = {
    game: (
      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    app: (
      <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    tool: (
      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    guide: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-4 shadow-xl shadow-black/20 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all games, apps, tools, and guides (titles, tags, slugs, packages)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141A29] border border-white/10 text-xs font-mono text-white placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white text-base leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Section Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "GAME", "APP", "TOOL", "GUIDE"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                selectedType === t
                  ? "bg-primary text-black font-bold"
                  : "bg-white/5 text-text-secondary hover:text-white border border-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {query.trim() && (
        <div className="flex items-center justify-between text-xs font-mono text-text-tertiary px-1">
          <span>
            {isSearching ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                Searching ecosystem...
              </span>
            ) : (
              `Found ${filteredResults.length} matching item(s)`
            )}
          </span>
          <span>Drafts &amp; Published Included</span>
        </div>
      )}

      {/* Results List */}
      {query.trim() && filteredResults.length > 0 && (
        <div className="space-y-3">
          {filteredResults.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="bg-[#0E131F] rounded-2xl border border-white/10 p-5 shadow-xl shadow-black/20 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="p-1 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    {typeIcons[item.type]}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
                    {item.type}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-text-secondary border border-white/10">
                    {item.category}
                  </span>
                  <StatusBadge status={item.status} />
                </div>

                <h3 className="text-base font-bold text-white hover:text-primary transition-colors truncate">
                  <Link href={item.editHref}>{item.title}</Link>
                </h3>

                <p className="text-xs text-text-secondary line-clamp-1">
                  {item.excerpt || item.subtitle}
                </p>

                {item.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] font-mono text-text-tertiary">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <Link
                  href={item.publicHref}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-text-secondary hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Public View</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>

                <Link
                  href={item.editHref}
                  className="py-1.5 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold font-mono text-xs transition-colors shadow-lg shadow-primary/20"
                >
                  Edit in Admin
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty States */}
      {query.trim() && !isSearching && filteredResults.length === 0 && (
        <div className="bg-[#0E131F] rounded-2xl border border-white/10 p-12 text-center shadow-xl shadow-black/20 space-y-3">
          <p className="text-sm font-bold text-white">No results matching &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try adjusting your search terms, filtering by a different section, or checking for typo variations.
          </p>
        </div>
      )}

      {!query.trim() && (
        <div className="bg-[#0E131F] rounded-2xl border border-dashed border-white/10 p-12 text-center space-y-2">
          <p className="text-sm font-bold text-white">Global Ecosystem Search</p>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Quickly locate and jump to any game, app release, diagnostic tool, or optimization guide across both live and draft content states.
          </p>
        </div>
      )}
    </div>
  );
}
