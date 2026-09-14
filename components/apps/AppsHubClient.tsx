"use client";

import * as React from "react";
import type { App, AppCategory } from "@/types/app";
import { AppCard } from "@/components/cards/AppCard";
import { filterApps, APP_CATEGORIES, type AppFilters } from "@/lib/apps";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";

interface AppsHubClientProps {
  initialApps: App[];
}

export function AppsHubClient({ initialApps }: AppsHubClientProps) {
  const [filters, setFilters] = React.useState<AppFilters>({
    query: "",
    category: "all",
    architecture: "all",
    minAndroid: "all",
    verification: "all",
    requiresRoot: "all",
  });

  const filteredApps = React.useMemo(() => {
    return filterApps(initialApps, filters);
  }, [initialApps, filters]);

  const handleReset = () => {
    setFilters({
      query: "",
      category: "all",
      architecture: "all",
      minAndroid: "all",
      verification: "all",
      requiresRoot: "all",
    });
  };

  const hasActiveFilters =
    filters.query !== "" ||
    filters.category !== "all" ||
    filters.architecture !== "all" ||
    filters.minAndroid !== "all" ||
    filters.verification !== "all" ||
    filters.requiresRoot !== "all";

  return (
    <div className="flex flex-col gap-8">
      {/* Search and Filter Control Bar */}
      <div className="flex flex-col gap-4 p-5 rounded-lg border border-border-default bg-bg-surface">
        {/* Search Bar */}
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
            placeholder="Search apps by name, description, package, or tags (e.g. FPS, Shizuku, Governor)..."
            className="w-full pl-10 pr-4 py-2.5 rounded bg-bg-elevated border border-border-default focus:border-accent focus:ring-1 focus:ring-accent text-sm text-text-primary placeholder:text-text-muted transition-colors outline-none font-sans"
            aria-label="Search Android apps"
          />
        </div>

        {/* Category Filter Pills */}
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
            All Categories ({initialApps.length})
          </button>
          {APP_CATEGORIES.map((cat: AppCategory) => {
            const count = initialApps.filter((a) => a.category.toLowerCase() === cat.toLowerCase()).length;
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

        {/* Advanced Filters: Architecture, Min Android, Root, Verification */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border-subtle text-xs font-mono">
          {/* Architecture */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-arch" className="text-2xs text-text-muted">
              CPU Architecture
            </label>
            <select
              id="filter-arch"
              value={filters.architecture}
              onChange={(e) => setFilters((prev) => ({ ...prev, architecture: e.target.value }))}
              className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-default text-text-secondary text-xs focus:border-accent outline-none"
            >
              <option value="all">All Architectures</option>
              <option value="arm64-v8a">ARM64 (arm64-v8a)</option>
              <option value="armeabi-v7a">ARM32 (armeabi-v7a)</option>
              <option value="universal">Universal</option>
            </select>
          </div>

          {/* Android Version */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-android" className="text-2xs text-text-muted">
              Target Android
            </label>
            <select
              id="filter-android"
              value={filters.minAndroid}
              onChange={(e) => setFilters((prev) => ({ ...prev, minAndroid: e.target.value }))}
              className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-default text-text-secondary text-xs focus:border-accent outline-none"
            >
              <option value="all">Any Version</option>
              <option value="8.0">Android 8.0 or older</option>
              <option value="10.0">Android 10.0 or older</option>
              <option value="12.0">Android 12.0 or older</option>
            </select>
          </div>

          {/* Root Requirement */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-root" className="text-2xs text-text-muted">
              Root Requirement
            </label>
            <select
              id="filter-root"
              value={filters.requiresRoot}
              onChange={(e) => setFilters((prev) => ({ ...prev, requiresRoot: e.target.value }))}
              className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-default text-text-secondary text-xs focus:border-accent outline-none"
            >
              <option value="all">All Modes</option>
              <option value="no-root">No Root Needed</option>
              <option value="root-only">Root Required</option>
            </select>
          </div>

          {/* Verification */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-verify" className="text-2xs text-text-muted">
              Verification
            </label>
            <select
              id="filter-verify"
              value={filters.verification}
              onChange={(e) => setFilters((prev) => ({ ...prev, verification: e.target.value }))}
              className="px-2.5 py-1.5 rounded bg-bg-elevated border border-border-default text-text-secondary text-xs focus:border-accent outline-none"
            >
              <option value="all">All Sources</option>
              <option value="verified">Verified Releases Only</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Clear Action */}
        <div className="flex items-center justify-between gap-3 pt-2 text-2xs font-mono text-text-muted">
          <span>
            Showing <strong className="text-text-primary">{filteredApps.length}</strong> of {initialApps.length} applications
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

      {/* Grid of App Cards */}
      {filteredApps.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-5" role="list">
          {filteredApps.map((app) => (
            <li key={app.id} className="h-full">
              <AppCard app={app} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-12 rounded-lg border border-border-default bg-bg-surface text-center flex flex-col items-center justify-center gap-3">
          <SlidersHorizontal size={32} className="text-text-muted" aria-hidden="true" />
          <h3 className="text-base font-semibold text-text-primary">
            No applications match your criteria
          </h3>
          <p className="text-sm text-text-secondary max-w-md">
            Try adjusting your search query, selecting another category, or resetting your filter criteria.
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
