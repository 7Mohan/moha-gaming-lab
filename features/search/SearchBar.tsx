"use client";

/**
 * features/search/SearchBar.tsx
 * ────────────────────────────────────────────────────────────────
 * Compact search input bar.
 * When clicked/focused, opens the GlobalSearchModal.
 * If used standalone with navigatesOnSubmit=true, submits to /search.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useSearch } from "./SearchProvider";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  /** If true, submits to /search?q=... on Enter. Default: true */
  navigatesOnSubmit?: boolean;
  /** If true, clicking opens the global search modal instead of inline. Default: true */
  opensModal?: boolean;
}

export function SearchBar({
  placeholder = "Search games, apps, tools, guides...",
  className = "",
  navigatesOnSubmit = true,
  opensModal = true,
}: SearchBarProps) {
  const [query, setQuery] = React.useState("");
  const router = useRouter();
  const inputId = React.useId();
  const { open: openModal } = useSearch();

  const handleFocus = () => {
    if (opensModal) {
      openModal();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (navigatesOnSubmit) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`relative ${className}`}
    >
      <label htmlFor={inputId} className="sr-only">
        Search Moha Gaming Lab
      </label>

      <div className="relative flex items-center">
        <Search
          size={15}
          className="absolute left-3 text-text-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          readOnly={opensModal}
          className="w-full h-10 pl-9 pr-14 bg-bg-elevated border border-border-default rounded-md
            text-sm text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/40
            transition-colors duration-150 cursor-pointer"
        />
        <div className="absolute right-2.5 flex items-center gap-1 pointer-events-none">
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-bg-surface border border-border-default rounded">
            ⌘K
          </kbd>
        </div>
      </div>
    </form>
  );
}
