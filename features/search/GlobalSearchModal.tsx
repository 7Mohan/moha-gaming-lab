"use client";

/**
 * features/search/GlobalSearchModal.tsx
 * ────────────────────────────────────────────────────────────────
 * Premium keyboard-driven global search overlay modal for Moha Gaming Lab.
 *
 * Features:
 *  - Cmd/Ctrl+K and "/" shortcuts to open from anywhere in the app
 *  - Instant in-memory results as you type (debounced 120ms)
 *  - Keyboard navigation (↑ ↓ Enter Esc)
 *  - Section tabs: All · Games · Tools · Apps · Guides with live counts
 *  - Recent searches with localStorage persistence and clear option
 *  - "Did you mean?" typo suggestion banner
 *  - Query suggestion chips when input is empty
 *  - Focus trap with scroll lock
 *  - Zero network requests — 100% local in-browser
 *  - Privacy-safe search analytics readiness
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowUp, ArrowDown, CornerDownLeft, Clock, Sparkles } from "lucide-react";
import { globalSearch, SUGGESTED_QUERIES, SECTION_COLORS } from "@/lib/search";
import { trackSearchEvent } from "@/lib/search-analytics";
import { SearchResultCard } from "./SearchResultCard";
import type { SearchResult, SearchSection } from "@/types/search";

const RECENT_SEARCHES_KEY = "moha_recent_searches";
const MAX_RECENT_SEARCHES = 6;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string): string[] {
  if (typeof window === "undefined" || !term.trim()) return [];
  try {
    const current = loadRecentSearches();
    const updated = [term.trim(), ...current.filter((item) => item.toLowerCase() !== term.trim().toLowerCase())].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}

/* ── Section tab pill ─────────────────────────────────────── */

function SectionTab({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid",
        borderColor: active ? (color ?? "var(--accent)") : "var(--border-default)",
        background: active ? `${color ?? "var(--accent)"}18` : "transparent",
        color: active ? (color ?? "var(--accent)") : "var(--text-secondary)",
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        letterSpacing: "0.04em",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            fontSize: "10px",
            color: active ? (color ?? "var(--accent)") : "var(--text-muted)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Keyboard shortcut hint ─────────────────────────────────── */

function KbdHint({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 20,
        height: 18,
        padding: "0 4px",
        borderRadius: "3px",
        border: "1px solid var(--border-strong)",
        background: "var(--bg-overlay)",
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        color: "var(--text-muted)",
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

/* ── Empty / zero-state ─────────────────────────────────────── */

function EmptyState({
  query,
  didYouMean,
  onApplySuggestion,
}: {
  query: string;
  didYouMean?: string;
  onApplySuggestion: (q: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "36px 24px",
        textAlign: "center",
        gap: 10,
      }}
    >
      <div style={{ fontSize: "28px", opacity: 0.4 }}>⌕</div>
      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
        No results for <strong style={{ color: "var(--text-primary)" }}>&ldquo;{query}&rdquo;</strong>
      </p>
      {didYouMean && (
        <div
          style={{
            marginTop: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          <span>Did you mean:</span>
          <button
            type="button"
            onClick={() => onApplySuggestion(didYouMean)}
            style={{
              background: "rgba(0, 229, 160, 0.12)",
              border: "1px solid rgba(0, 229, 160, 0.35)",
              color: "var(--accent)",
              padding: "2px 8px",
              borderRadius: "var(--radius-xs)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: "11px",
            }}
          >
            {didYouMean}
          </button>
        </div>
      )}
      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        Try different keywords, inspect spelling, or explore the suggestions below
      </p>
    </div>
  );
}

/* ── Main Modal ────────────────────────────────────────────── */

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeSection, setActiveSection] = React.useState<SearchSection>("all");
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Load recent searches when opened
  React.useEffect(() => {
    if (isOpen) {
      setRecentSearches(loadRecentSearches());
    }
  }, [isOpen]);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  const results = React.useMemo(
    () => (debouncedQuery ? globalSearch(debouncedQuery, 6) : null),
    [debouncedQuery]
  );

  // Telemetry: track search query & zero results
  React.useEffect(() => {
    if (!debouncedQuery.trim()) return;
    if (results) {
      trackSearchEvent({
        type: "search_query",
        query: debouncedQuery.trim(),
        resultCount: results.total,
        section: activeSection,
        timestamp: Date.now(),
      });
      if (results.total === 0) {
        trackSearchEvent({
          type: "search_zero_results",
          query: debouncedQuery.trim(),
          suggestedAlternative: results.didYouMean,
          timestamp: Date.now(),
        });
      }
    }
  }, [debouncedQuery, results, activeSection]);

  // Visible results list based on active section
  const visibleResults = React.useMemo<SearchResult[]>(() => {
    if (!results) return [];
    if (activeSection === "all") return results.all;
    if (activeSection === "game") return results.games;
    if (activeSection === "tool") return results.tools;
    if (activeSection === "app") return results.apps;
    if (activeSection === "guide") return results.guides;
    return [];
  }, [results, activeSection]);

  // Reset when closed
  React.useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setActiveSection("all");
      setActiveIndex(-1);
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll lock
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset active index on query/section change
  React.useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery, activeSection]);

  // Navigate to full search page
  const goToSearch = React.useCallback(() => {
    if (!query.trim()) return;
    saveRecentSearch(query.trim());
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    onClose();
  }, [query, router, onClose]);

  const handleSelectResult = (item: SearchResult, index: number) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
    trackSearchEvent({
      type: "search_result_click",
      query: query.trim(),
      resultId: item.id,
      resultType: item.type,
      resultTitle: item.title,
      position: index,
      timestamp: Date.now(),
    });
    router.push(item.href);
    onClose();
  };

  const handleSelectSuggestion = (term: string, source: "empty_state" | "did_you_mean" | "recent") => {
    trackSearchEvent({
      type: "search_suggestion_click",
      suggestion: term,
      source,
      timestamp: Date.now(),
    });
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, visibleResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && visibleResults[activeIndex]) {
        handleSelectResult(visibleResults[activeIndex], activeIndex);
      } else {
        goToSearch();
      }
    }
  };

  if (!isOpen) return null;

  const sections: Array<{ key: SearchSection; label: string; count: number; color: string }> = [
    { key: "all", label: "All", count: results?.total ?? 0, color: "#00E5A0" },
    { key: "game", label: "Games", count: results?.games.length ?? 0, color: SECTION_COLORS["game"] ?? "#00E5A0" },
    { key: "tool", label: "Tools", count: results?.tools.length ?? 0, color: SECTION_COLORS["tool"] ?? "#00E5A0" },
    { key: "app", label: "Apps", count: results?.apps.length ?? 0, color: SECTION_COLORS["app"] ?? "#00E5A0" },
    { key: "guide", label: "Guides", count: results?.guides.length ?? 0, color: SECTION_COLORS["guide"] ?? "#00E5A0" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(10, 12, 16, 0.85)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global Search"
        style={{
          position: "fixed",
          top: "10vh",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 51,
          width: "min(640px, calc(100vw - 32px))",
          maxHeight: "72vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-lg), 0 0 60px -12px rgba(0, 229, 160, 0.08)",
          overflow: "hidden",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderBottom: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}
        >
          <Search size={16} style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games, tools, apps, guides..."
            autoComplete="off"
            spellCheck="false"
            style={{
              flex: 1,
              height: 36,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            style={{
              padding: "3px 7px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-default)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            Esc
          </button>
        </div>

        {/* Section tabs — only show when there are results */}
        {results && results.total > 0 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "8px 12px",
              borderBottom: "1px solid var(--border-subtle)",
              flexShrink: 0,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {sections.map(({ key, label, count, color }) => (
              <SectionTab
                key={key}
                label={label}
                count={key !== "all" ? count : undefined}
                active={activeSection === key}
                color={color}
                onClick={() => {
                  setActiveSection(key);
                  trackSearchEvent({
                    type: "search_filter_change",
                    filterName: "section",
                    filterValue: key,
                    query: debouncedQuery,
                    timestamp: Date.now(),
                  });
                }}
              />
            ))}
          </div>
        )}

        {/* "Did you mean?" banner when results exist but typo detected */}
        {results && results.didYouMean && results.total > 0 && (
          <div
            style={{
              padding: "6px 14px",
              background: "rgba(0, 229, 160, 0.06)",
              borderBottom: "1px solid rgba(0, 229, 160, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "11px",
              color: "var(--text-secondary)",
            }}
          >
            <Sparkles size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <span>
              Did you mean:{" "}
              <button
                type="button"
                onClick={() => handleSelectSuggestion(results.didYouMean!, "did_you_mean")}
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
                {results.didYouMean}
              </button>
              ?
            </span>
          </div>
        )}

        {/* Results / suggestions */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--border-strong) transparent",
          }}
        >
          {/* Empty query state: Recent searches & Suggestions */}
          {!query && (
            <div style={{ padding: "10px 8px" }}>
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      <Clock size={11} />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={handleClearRecent}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSelectSuggestion(term, "recent")}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-default)",
                          background: "var(--bg-elevated)",
                          color: "var(--text-primary)",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all var(--transition-fast)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Clock size={10} style={{ opacity: 0.6 }} />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  Suggested Topics
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SUGGESTED_QUERIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSelectSuggestion(q, "empty_state")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-default)",
                        background: "transparent",
                        color: "var(--text-secondary)",
                        fontSize: "12px",
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
            </div>
          )}

          {/* Query but no results */}
          {query && debouncedQuery && results && results.total === 0 && (
            <EmptyState
              query={debouncedQuery}
              didYouMean={results.didYouMean}
              onApplySuggestion={(s) => handleSelectSuggestion(s, "did_you_mean")}
            />
          )}

          {/* Results list */}
          {results && visibleResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {visibleResults.map((result, i) => (
                <SearchResultCard
                  key={`${result.type}-${result.id}`}
                  result={result}
                  query={debouncedQuery}
                  compact={true}
                  isActive={i === activeIndex}
                  onClick={() => handleSelectResult(result, i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            borderTop: "1px solid var(--border-subtle)",
            flexShrink: 0,
            gap: 12,
          }}
        >
          {/* Keyboard hints */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <KbdHint><ArrowUp size={8} /></KbdHint>
              <KbdHint><ArrowDown size={8} /></KbdHint>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                navigate
              </span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <KbdHint><CornerDownLeft size={8} /></KbdHint>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                open
              </span>
            </span>
          </div>

          {/* View all results button */}
          {query.trim() && (
            <button
              type="button"
              onClick={goToSearch}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(0, 229, 160, 0.3)",
                background: "var(--accent-muted)",
                color: "var(--accent)",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontWeight: 600,
              }}
            >
              View all results →
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Hook: global Cmd/Ctrl+K and "/" shortcuts ─────────────────────── */

export function useGlobalSearchShortcut(onOpen: () => void) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      } else if (!isInput && e.key === "/") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
}
