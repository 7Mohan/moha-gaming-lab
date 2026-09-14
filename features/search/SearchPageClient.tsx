"use client";

/**
 * features/search/SearchPageClient.tsx
 * ────────────────────────────────────────────────────────────────
 * Full search results page client component for Moha Gaming Lab.
 *
 * Features:
 *  - URL-synced query params: ?q=, ?section=, ?sort=, ?game=
 *  - Section tabs: All · Games · Tools · Apps · Guides with live counts
 *  - Sorting: Relevance vs. Alphabetical (A-Z)
 *  - Cross-section Game filter: filter all results linked to a game
 *  - "Did you mean?" typo suggestion banner
 *  - Grouped sections in "All" view with section headers and accents
 *  - Empty state with curated suggested queries & category jumps
 *  - Integrated search telemetry
 */

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, SlidersHorizontal, Sparkles, Filter } from "lucide-react";
import { globalSearch, SUGGESTED_QUERIES, SECTION_COLORS } from "@/lib/search";
import { trackSearchEvent } from "@/lib/search-analytics";
import { games as ALL_GAMES } from "@/data/games";
import { SearchResultCard } from "./SearchResultCard";
import type { SearchResult, SearchSection, SearchSortOption } from "@/types/search";

/* ── Section tab ────────────────────────────────────────────── */

function SectionTab({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid",
        borderColor: active ? color : "var(--border-default)",
        background: active ? `${color}18` : "transparent",
        color: active ? color : "var(--text-secondary)",
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        letterSpacing: "0.04em",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <span
        style={{
          fontSize: "11px",
          background: active ? `${color}30` : "var(--bg-elevated)",
          color: active ? color : "var(--text-muted)",
          padding: "1px 6px",
          borderRadius: "var(--radius-xs)",
          fontWeight: 700,
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* ── Section group header ───────────────────────────────────── */

function SectionGroupHeader({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
        paddingBottom: 8,
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <span
        style={{
          width: 3,
          height: 14,
          borderRadius: 2,
          background: color,
          display: "inline-block",
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: color,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
        }}
      >
        ({count})
      </span>
    </div>
  );
}

/* ── Empty state with suggestions ───────────────────────────── */

function SuggestionsGrid({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Popular queries */}
      <div>
        <h2
          style={{
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: 12,
          }}
        >
          Popular Searches
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSelect(q)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2
          style={{
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: 12,
          }}
        >
          Browse by Section
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
          {[
            { href: "/games", label: "Games", desc: "Performance profiles", color: SECTION_COLORS.game },
            { href: "/tools", label: "Tools", desc: "Browser diagnostics", color: SECTION_COLORS.tool },
            { href: "/apps", label: "Apps", desc: "Android downloads", color: SECTION_COLORS.app },
            { href: "/guides", label: "Guides", desc: "Technical knowledge", color: SECTION_COLORS.guide },
          ].map(({ href, label, desc, color }) => (
            <a
              key={href}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                textDecoration: "none",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = color + "50";
                (e.currentTarget as HTMLElement).style.background = color + "08";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {desc}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── No results ─────────────────────────────────────────────── */

function NoResultsState({
  query,
  didYouMean,
  onApplySuggestion,
  onClear,
}: {
  query: string;
  didYouMean?: string;
  onApplySuggestion: (term: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        padding: "48px 0",
        maxWidth: 480,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "var(--radius-md)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          marginBottom: 16,
          color: "var(--text-muted)",
        }}
      >
        <Search size={22} aria-hidden="true" />
      </div>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        No results for &ldquo;{query}&rdquo;
      </h2>
      {didYouMean && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(0, 229, 160, 0.08)",
            border: "1px solid rgba(0, 229, 160, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "13px",
          }}
        >
          <Sparkles size={14} style={{ color: "var(--accent)" }} />
          <span>
            Did you mean:{" "}
            <button
              type="button"
              onClick={() => onApplySuggestion(didYouMean)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent)",
                fontWeight: 700,
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0,
                fontSize: "13px",
              }}
            >
              {didYouMean}
            </button>
            ?
          </span>
        </div>
      )}
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
        Try different keywords, check your spelling, or browse by section below.
      </p>
      <button
        type="button"
        onClick={onClear}
        style={{
          padding: "8px 16px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-default)",
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
          fontSize: "13px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <X size={13} aria-hidden="true" />
        Clear search
      </button>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export function SearchPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") ?? "";
  const urlSection = (searchParams.get("section") ?? "all") as SearchSection;
  const urlSort = (searchParams.get("sort") ?? "relevance") as SearchSortOption;
  const urlGame = searchParams.get("game") ?? "";

  const [query, setQuery] = React.useState(urlQuery);
  const [activeSection, setActiveSection] = React.useState<SearchSection>(urlSection);
  const [sortOption, setSortOption] = React.useState<SearchSortOption>(urlSort);
  const [selectedGame, setSelectedGame] = React.useState<string>(urlGame);
  const [showFilters, setShowFilters] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync URL on query/section/sort/game change
  const syncUrl = React.useCallback(
    (q: string, s: SearchSection, sort: SearchSortOption, game: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (s !== "all") params.set("section", s);
      if (sort !== "relevance") params.set("sort", sort);
      if (game) params.set("game", game);
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Debounced URL sync
  React.useEffect(() => {
    const t = setTimeout(() => syncUrl(query, activeSection, sortOption, selectedGame), 300);
    return () => clearTimeout(t);
  }, [query, activeSection, sortOption, selectedGame, syncUrl]);

  // Re-sync from URL when navigated to externally
  React.useEffect(() => {
    setQuery(urlQuery);
    setActiveSection(urlSection);
    setSortOption(urlSort);
    setSelectedGame(urlGame);
  }, [urlQuery, urlSection, urlSort, urlGame]);

  // Search execution
  const rawResults = React.useMemo(
    () => (query.trim() ? globalSearch(query.trim(), 20) : null),
    [query]
  );

  // Telemetry: search query & zero results
  React.useEffect(() => {
    if (!query.trim() || !rawResults) return;
    trackSearchEvent({
      type: "search_query",
      query: query.trim(),
      resultCount: rawResults.total,
      section: activeSection,
      timestamp: Date.now(),
    });
    if (rawResults.total === 0) {
      trackSearchEvent({
        type: "search_zero_results",
        query: query.trim(),
        suggestedAlternative: rawResults.didYouMean,
        timestamp: Date.now(),
      });
    }
  }, [query, rawResults, activeSection]);

  // Filter items by related game if game filter is active
  const filterByGame = React.useCallback(
    <T extends SearchResult>(items: T[]): T[] => {
      if (!selectedGame) return items;
      return items.filter((item) => {
        if (item.type === "game") return item.slug === selectedGame;
        return item.relatedGameSlugs?.includes(selectedGame);
      });
    },
    [selectedGame]
  );

  // Sort helper
  const sortItems = React.useCallback(
    <T extends SearchResult>(items: T[]): T[] => {
      if (sortOption === "alphabetical") {
        return [...items].sort((a, b) => a.title.localeCompare(b.title));
      }
      return items; // Default is relevance order from globalSearch
    },
    [sortOption]
  );

  const filteredGames = React.useMemo(
    () => (rawResults ? sortItems(filterByGame(rawResults.games)) : []),
    [rawResults, filterByGame, sortItems]
  );
  const filteredTools = React.useMemo(
    () => (rawResults ? sortItems(filterByGame(rawResults.tools)) : []),
    [rawResults, filterByGame, sortItems]
  );
  const filteredApps = React.useMemo(
    () => (rawResults ? sortItems(filterByGame(rawResults.apps)) : []),
    [rawResults, filterByGame, sortItems]
  );
  const filteredGuides = React.useMemo(
    () => (rawResults ? sortItems(filterByGame(rawResults.guides)) : []),
    [rawResults, filterByGame, sortItems]
  );

  const filteredAll = React.useMemo(() => {
    const combined = [...filteredGames, ...filteredTools, ...filteredApps, ...filteredGuides];
    if (sortOption === "alphabetical") {
      return combined.sort((a, b) => a.title.localeCompare(b.title));
    }
    return combined;
  }, [filteredGames, filteredTools, filteredApps, filteredGuides, sortOption]);

  const totalFilteredCount = filteredGames.length + filteredTools.length + filteredApps.length + filteredGuides.length;

  // Visible items based on section
  const visibleItems = React.useMemo<SearchResult[]>(() => {
    if (!rawResults) return [];
    if (activeSection === "all") return filteredAll;
    if (activeSection === "game") return filteredGames;
    if (activeSection === "tool") return filteredTools;
    if (activeSection === "app") return filteredApps;
    if (activeSection === "guide") return filteredGuides;
    return [];
  }, [rawResults, activeSection, filteredAll, filteredGames, filteredTools, filteredApps, filteredGuides]);

  const handleQueryChange = (q: string) => {
    setQuery(q);
  };

  const handleClear = () => {
    setQuery("");
    setActiveSection("all");
    setSelectedGame("");
    setSortOption("relevance");
    inputRef.current?.focus();
  };

  const sections: Array<{ key: SearchSection; label: string; count: number; color: string }> = [
    { key: "all", label: "All", count: totalFilteredCount, color: "#00E5A0" },
    { key: "game", label: "Games", count: filteredGames.length, color: SECTION_COLORS["game"] ?? "#00E5A0" },
    { key: "tool", label: "Tools", count: filteredTools.length, color: SECTION_COLORS["tool"] ?? "#00E5A0" },
    { key: "app", label: "Apps", count: filteredApps.length, color: SECTION_COLORS["app"] ?? "#00E5A0" },
    { key: "guide", label: "Guides", count: filteredGuides.length, color: SECTION_COLORS["guide"] ?? "#00E5A0" },
  ];

  const activeColor = sections.find((s) => s.key === activeSection)?.color ?? "#00E5A0";

  return (
    <div className="container-content" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
      {/* Page header */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            Universal Discovery
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          Search Moha Gaming Lab
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Unified search across Games · Tools · Apps · Guides
        </p>
      </div>

      {/* Search input & controls */}
      <div style={{ maxWidth: 740, marginBottom: rawResults ? "1rem" : "2rem" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid",
            borderColor: query ? "var(--border-strong)" : "var(--border-default)",
            background: "var(--bg-surface)",
            transition: "border-color var(--transition-fast)",
          }}
        >
          <Search size={17} style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search games, tools, apps, guides (e.g. PUBG, refresh rate, Shizuku)..."
            autoComplete="off"
            aria-label="Search Moha Gaming Lab"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "16px",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              minWidth: 0,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle advanced filters"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 9px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid",
              borderColor: selectedGame || sortOption !== "relevance" ? "var(--accent)" : "var(--border-default)",
              background: selectedGame || sortOption !== "relevance" ? "rgba(0, 229, 160, 0.1)" : "var(--bg-elevated)",
              color: selectedGame || sortOption !== "relevance" ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}
          >
            <SlidersHorizontal size={12} />
            Filters
            {(selectedGame || sortOption !== "relevance") && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "inline-block",
                }}
              />
            )}
          </button>
        </div>

        {/* Filter Drawer / Bar */}
        {showFilters && (
          <div
            style={{
              marginTop: 10,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-surface)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Sort Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                Sort:
              </span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SearchSortOption)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="relevance">Relevance</option>
                <option value="alphabetical">Alphabetical (A–Z)</option>
              </select>
            </div>

            {/* Game relevance filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                Game Filter:
              </span>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">All Games</option>
                {ALL_GAMES.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset active filters */}
            {(selectedGame || sortOption !== "relevance") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGame("");
                  setSortOption("relevance");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent)",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* "Did you mean?" banner */}
      {rawResults && rawResults.didYouMean && totalFilteredCount > 0 && (
        <div
          style={{
            maxWidth: 740,
            marginBottom: "1rem",
            padding: "8px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(0, 229, 160, 0.08)",
            border: "1px solid rgba(0, 229, 160, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          <Sparkles size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span>
            Did you mean:{" "}
            <button
              type="button"
              onClick={() => handleQueryChange(rawResults.didYouMean!)}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                color: "var(--accent)",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "var(--font-mono)",
              }}
            >
              {rawResults.didYouMean}
            </button>
            ?
          </span>
        </div>
      )}

      {/* Section tabs */}
      {rawResults && totalFilteredCount > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: "1.5rem",
            overflowX: "auto",
            scrollbarWidth: "none",
            paddingBottom: 4,
            maxWidth: 740,
          }}
        >
          {sections.map(({ key, label, count, color }) => (
            <SectionTab
              key={key}
              label={label}
              count={count}
              active={activeSection === key}
              color={color}
              onClick={() => setActiveSection(key)}
            />
          ))}
        </div>
      )}

      {/* Results area */}
      <div style={{ maxWidth: 740 }}>
        {/* No query: show curated suggestions */}
        {!query && (
          <SuggestionsGrid
            onSelect={(q) => {
              handleQueryChange(q);
              inputRef.current?.focus();
            }}
          />
        )}

        {/* No results for query */}
        {query && rawResults && totalFilteredCount === 0 && (
          <NoResultsState
            query={query}
            didYouMean={rawResults.didYouMean}
            onApplySuggestion={(term) => handleQueryChange(term)}
            onClear={handleClear}
          />
        )}

        {/* Results — All section (grouped by type) */}
        {rawResults && totalFilteredCount > 0 && activeSection === "all" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {filteredGames.length > 0 && (
              <section aria-labelledby="results-games">
                <SectionGroupHeader
                  label="Games"
                  count={filteredGames.length}
                  color={SECTION_COLORS["game"] ?? "#00E5A0"}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {filteredGames.slice(0, 6).map((r) => (
                    <SearchResultCard key={r.id} result={r} query={query} />
                  ))}
                </div>
              </section>
            )}

            {filteredTools.length > 0 && (
              <section aria-labelledby="results-tools">
                <SectionGroupHeader
                  label="Tools"
                  count={filteredTools.length}
                  color={SECTION_COLORS["tool"] ?? "#00E5A0"}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {filteredTools.slice(0, 6).map((r) => (
                    <SearchResultCard key={r.id} result={r} query={query} />
                  ))}
                </div>
              </section>
            )}

            {filteredApps.length > 0 && (
              <section aria-labelledby="results-apps">
                <SectionGroupHeader
                  label="Apps"
                  count={filteredApps.length}
                  color={SECTION_COLORS["app"] ?? "#00E5A0"}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {filteredApps.slice(0, 6).map((r) => (
                    <SearchResultCard key={r.id} result={r} query={query} />
                  ))}
                </div>
              </section>
            )}

            {filteredGuides.length > 0 && (
              <section aria-labelledby="results-guides">
                <SectionGroupHeader
                  label="Guides"
                  count={filteredGuides.length}
                  color={SECTION_COLORS["guide"] ?? "#00E5A0"}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {filteredGuides.slice(0, 6).map((r) => (
                    <SearchResultCard key={r.id} result={r} query={query} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Results — Specific section (flat list) */}
        {rawResults && totalFilteredCount > 0 && activeSection !== "all" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <SectionGroupHeader
                label={sections.find((s) => s.key === activeSection)?.label ?? ""}
                count={visibleItems.length}
                color={activeColor}
              />
            </div>
            {visibleItems.length === 0 ? (
              <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                No {sections.find((s) => s.key === activeSection)?.label.toLowerCase()} results match your current filters.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {visibleItems.map((r) => (
                  <SearchResultCard key={r.id} result={r} query={query} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Total count footer */}
      {rawResults && totalFilteredCount > 0 && (
        <div
          style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            maxWidth: 740,
          }}
        >
          {totalFilteredCount} result{totalFilteredCount !== 1 ? "s" : ""} for{" "}
          <strong style={{ color: "var(--text-secondary)" }}>&ldquo;{query}&rdquo;</strong>
          {selectedGame && ` · filtered by ${ALL_GAMES.find((g) => g.slug === selectedGame)?.name ?? selectedGame}`}
          {sortOption === "alphabetical" && " · sorted alphabetically"}
          {" "}— ranked by relevance across all Moha Gaming Lab sections
        </div>
      )}
    </div>
  );
}
