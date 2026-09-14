"use client";

import * as React from "react";
import type { Guide, GuideCategory } from "@/types/guide";
import { GuideCard } from "@/components/cards/GuideCard";
import { filterGuides, GUIDE_CATEGORIES, GUIDE_DIFFICULTIES, GUIDE_CONTENT_TYPES, type GuideFilters } from "@/lib/guides";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";

interface GuidesHubClientProps {
  initialGuides: Guide[];
}

export function GuidesHubClient({ initialGuides }: GuidesHubClientProps) {
  const [filters, setFilters] = React.useState<GuideFilters>({
    query: "",
    category: "all",
    difficulty: "all",
    contentType: "all",
    gameId: "all",
  });

  const filteredGuides = React.useMemo(() => {
    return filterGuides(initialGuides, filters);
  }, [initialGuides, filters]);

  const handleReset = () => {
    setFilters({
      query: "",
      category: "all",
      difficulty: "all",
      contentType: "all",
      gameId: "all",
    });
  };

  const hasActiveFilters =
    filters.query !== "" ||
    filters.category !== "all" ||
    filters.difficulty !== "all" ||
    filters.contentType !== "all" ||
    filters.gameId !== "all";

  return (
    <div className="flex flex-col gap-8">
      {/* Search and Filters Control Bar */}
      <div className="flex flex-col gap-4 p-5 rounded-lg border border-border-default bg-bg-surface">
        {/* Search Input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            placeholder="Search guides by title, concept, or hardware (e.g. FPS drops, 120Hz, ping, throttling, touch delay)..."
            className="w-full pl-10 pr-4 py-2.5 rounded bg-bg-elevated border border-border-default focus:border-accent focus:ring-1 focus:ring-accent text-sm text-text-primary placeholder:text-text-muted transition-colors outline-none font-sans"
            aria-label="Search guides"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, category: "all" }))}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors whitespace-nowrap ${
              filters.category === "all"
                ? "bg-accent text-bg-base font-semibold"
                : "bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-overlay border border-border-subtle"
            }`}
          >
            All Categories ({initialGuides.length})
          </button>
          {GUIDE_CATEGORIES.map((cat: GuideCategory) => {
            const count = initialGuides.filter((g) => g.category.toLowerCase() === cat.toLowerCase()).length;
            if (count === 0) return null;
            const isSelected = filters.category?.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, category: isSelected ? "all" : cat }))}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors whitespace-nowrap ${
                  isSelected
                    ? "bg-accent text-bg-base font-semibold"
                    : "bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-overlay border border-border-subtle"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Dropdown Filters: Difficulty & Content Type */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border-subtle text-xs font-mono">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-difficulty" className="text-2xs text-text-muted">
              Difficulty
            </label>
            <select
              id="filter-difficulty"
              value={filters.difficulty}
              onChange={(e) => setFilters((prev) => ({ ...prev, difficulty: e.target.value }))}
              className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-default text-text-secondary text-xs focus:border-accent outline-none"
            >
              <option value="all">All Difficulties</option>
              {GUIDE_DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-type" className="text-2xs text-text-muted">
              Content Type
            </label>
            <select
              id="filter-type"
              value={filters.contentType}
              onChange={(e) => setFilters((prev) => ({ ...prev, contentType: e.target.value }))}
              className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-default text-text-secondary text-xs focus:border-accent outline-none"
            >
              <option value="all">All Content Types</option>
              {GUIDE_CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <label htmlFor="filter-game" className="text-2xs text-text-muted">
              Specific Game
            </label>
            <select
              id="filter-game"
              value={filters.gameId}
              onChange={(e) => setFilters((prev) => ({ ...prev, gameId: e.target.value }))}
              className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-default text-text-secondary text-xs focus:border-accent outline-none"
            >
              <option value="all">All Titles</option>
              <option value="pubg-mobile">PUBG Mobile</option>
              <option value="call-of-duty-mobile">Call of Duty: Mobile</option>
              <option value="efootball">eFootball™</option>
            </select>
          </div>
        </div>

        {/* Counter and Reset */}
        <div className="flex items-center justify-between gap-3 pt-2 text-2xs font-mono text-text-muted">
          <span>
            Showing <strong className="text-text-primary">{filteredGuides.length}</strong> of {initialGuides.length} technical guides
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <RotateCcw size={11} aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Guide Cards */}
      {filteredGuides.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
          {filteredGuides.map((guide) => (
            <li key={guide.id} className="h-full">
              <GuideCard guide={guide} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-12 rounded-lg border border-border-default bg-bg-surface text-center flex flex-col items-center justify-center gap-3">
          <SlidersHorizontal size={32} className="text-text-muted" aria-hidden="true" />
          <h3 className="text-base font-semibold text-text-primary">
            No guides found
          </h3>
          <p className="text-sm text-text-secondary max-w-md">
            Try another search term, select a different category, or reset your filters.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 px-4 py-2 rounded bg-bg-elevated hover:bg-bg-overlay border border-border-default text-xs font-mono text-accent transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
