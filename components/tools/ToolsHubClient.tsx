"use client";

import * as React from "react";
import { Search, X, Wrench } from "lucide-react";
import type { Tool, ToolCategory, ToolPlatform } from "@/types/tool";
import { ToolCard } from "@/components/cards/ToolCard";
import {
  filterTools,
  TOOL_CATEGORIES,
} from "@/lib/tools";

export function ToolsHubClient({ initialTools }: { initialTools: Tool[] }) {
  const [query, setQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<ToolCategory | "all">("all");
  const [selectedPlatform, setSelectedPlatform] = React.useState<ToolPlatform | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<"all" | "beginner" | "intermediate" | "advanced">("all");

  const filteredTools = React.useMemo(() => {
    return filterTools(initialTools, {
      query,
      category: selectedCategory,
      platform: selectedPlatform,
      difficulty: selectedDifficulty,
    });
  }, [initialTools, query, selectedCategory, selectedPlatform, selectedDifficulty]);

  const hasActiveFilters =
    query.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedPlatform !== "all" ||
    selectedDifficulty !== "all";

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedPlatform("all");
    setSelectedDifficulty("all");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <label htmlFor="tool-search" className="sr-only">
            Search gaming diagnostics tools
          </label>
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools: FPS, Ping, Touch, Refresh Rate, WebGL, Gamepad, Storage..."
            className="w-full pl-10 pr-10 py-3 rounded-md bg-bg-surface border border-border-default text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
              aria-label="Clear search input"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills & Dropdowns */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Category Horizontal Scrolling / Wrapping Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xs text-xs font-mono transition-colors ${
                selectedCategory === "all"
                  ? "bg-accent text-bg-base font-bold"
                  : "bg-bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default"
              }`}
            >
              All Tools ({initialTools.length})
            </button>

            {TOOL_CATEGORIES.map((cat) => {
              const count = initialTools.filter((t) => t.category === cat.id).length;
              if (count === 0) return null;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? "all" : cat.id)}
                  className={`px-3 py-1.5 rounded-xs text-xs font-mono transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-accent text-bg-base font-bold"
                      : "bg-bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] opacity-75 ${isSelected ? "text-bg-base" : "text-text-muted"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filters (Platform & Difficulty) */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as typeof selectedPlatform)}
              className="px-2.5 py-1.5 rounded-xs bg-bg-surface border border-border-subtle text-xs font-mono text-text-secondary hover:border-border-default focus:outline-none focus:border-accent"
              aria-label="Filter by Platform"
            >
              <option value="all">All Platforms</option>
              <option value="web">Web Browser</option>
              <option value="android">Android</option>
              <option value="windows">Windows</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as typeof selectedDifficulty)}
              className="px-2.5 py-1.5 rounded-xs bg-bg-surface border border-border-subtle text-xs font-mono text-text-secondary hover:border-border-default focus:outline-none focus:border-accent"
              aria-label="Filter by Difficulty"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-mono text-accent hover:underline px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs font-mono text-text-muted border-b border-border-subtle pb-3">
        <span>
          Showing <strong className="text-text-primary">{filteredTools.length}</strong> of {initialTools.length} diagnostic utilities
        </span>
        <span className="text-2xs">100% Client-Side • Privacy First</span>
      </div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" role="list">
          {filteredTools.map((tool) => (
            <li key={tool.id}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      ) : (
        /* Empty State */
        <div className="border border-border-default bg-bg-surface rounded-md p-12 flex flex-col items-center justify-center text-center gap-4">
          <Wrench size={32} className="text-text-muted opacity-60" />
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              No matching diagnostic tools found
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mt-1">
              Try adjusting your search terms or clearing the selected category and platform filters.
            </p>
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xs bg-accent/10 border border-accent/30 text-accent text-xs font-mono font-semibold hover:bg-accent/20 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
