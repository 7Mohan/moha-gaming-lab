"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Game, GameCategory, PerformanceArea } from "@/types/game";
import {
  filterGames,
  CATEGORY_LABELS,
  PERFORMANCE_AREA_LABELS,
  getAvailableCategories,
  getAvailablePerformanceAreas,
  type GameFilters,
  DEFAULT_FILTERS,
} from "@/lib/games";
import { GameCard } from "@/components/cards/GameCard";

/* ── Types ─────────────────────────────────────────────────── */

interface GameHubClientProps {
  games: Game[];
}

/* ── Select control ─────────────────────────────────────────── */

function FilterSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="label-mono text-[10px]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(
          "h-9 px-3 pr-7 text-sm rounded-md appearance-none",
          "bg-bg-elevated border border-border-default text-text-primary",
          "hover:border-border-strong transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          "cursor-pointer font-mono text-xs"
        )}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────── */

function EmptyState({
  query,
  onReset,
}: {
  query: string;
  onReset: () => void;
}) {
  return (
    <div
      className="col-span-full flex flex-col items-center justify-center gap-4 py-20 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-10 h-10 rounded-md bg-bg-elevated border border-border-default flex items-center justify-center"
        aria-hidden="true"
      >
        <Search size={18} className="text-text-muted" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-text-primary">
          {query ? `No games found for "${query}"` : "No games match these filters"}
        </p>
        <p className="text-sm text-text-secondary">
          Try a different game name or remove a filter.
        </p>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 h-8 px-4 text-sm font-semibold rounded-md
          bg-bg-elevated border border-border-default text-text-primary
          hover:border-border-strong hover:bg-bg-overlay transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <X size={14} aria-hidden="true" />
        Reset filters
      </button>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export function GameHubClient({ games }: GameHubClientProps) {
  const [filters, setFilters] = React.useState<GameFilters>(DEFAULT_FILTERS);

  const availableCategories = React.useMemo(() => getAvailableCategories(games), [games]);
  const availablePerformanceAreas = React.useMemo(() => getAvailablePerformanceAreas(games), [games]);

  const filtered = React.useMemo(() => filterGames(games, filters), [games, filters]);

  const categoryOptions = availableCategories.map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c],
  }));

  const performanceOptions = availablePerformanceAreas.map((a) => ({
    value: a,
    label: PERFORMANCE_AREA_LABELS[a],
  }));

  const hasActiveFilters =
    filters.query !== "" ||
    filters.category !== "all" ||
    filters.performanceArea !== "all";

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Search + Filters bar ── */}
      <div
        className="flex flex-col sm:flex-row gap-3 sm:items-end"
        role="search"
        aria-label="Filter games"
      >
        {/* Search input */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label htmlFor="game-search" className="label-mono text-[10px]">
            Search
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="game-search"
              type="search"
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              placeholder="PUBG Mobile, eFootball, CoD…"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "w-full h-9 pl-8 pr-4 text-sm rounded-md",
                "bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted",
                "hover:border-border-strong transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              )}
            />
            {filters.query && (
              <button
                onClick={() => setFilters((f) => ({ ...f, query: "" }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Genre filter */}
        <FilterSelect<GameCategory | "all">
          id="filter-category"
          label="Genre"
          value={filters.category}
          options={categoryOptions}
          onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
        />

        {/* Performance focus filter */}
        <FilterSelect<PerformanceArea | "all">
          id="filter-area"
          label="Performance Focus"
          value={filters.performanceArea}
          options={performanceOptions}
          onChange={(v) => setFilters((f) => ({ ...f, performanceArea: v }))}
        />

        {/* Reset — only shows when filters active */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="self-end h-9 px-3 text-xs font-mono text-text-muted hover:text-text-primary
              rounded-md border border-border-default hover:border-border-strong
              bg-bg-elevated hover:bg-bg-overlay transition-colors
              flex items-center gap-1.5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            aria-label="Reset all filters"
          >
            <X size={12} aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      {/* ── Result count ── */}
      <div className="flex items-center justify-between">
        <p
          className="text-sm text-text-muted font-mono"
          aria-live="polite"
          aria-atomic="true"
        >
          {filtered.length === games.length
            ? `${games.length} games`
            : `${filtered.length} of ${games.length} games`}
        </p>
      </div>

      {/* ── Game grid ── */}
      {filtered.length === 0 ? (
        <EmptyState query={filters.query} onReset={resetFilters} />
      ) : (
        <ul className="grid-cards-3" role="list">
          {filtered.map((game) => (
            <li key={game.id}>
              <GameCard game={game} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
