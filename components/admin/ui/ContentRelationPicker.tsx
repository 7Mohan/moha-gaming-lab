"use client";

import * as React from "react";
import { Search, X, Plus } from "lucide-react";

export interface RelationOption {
  slug: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

interface ContentRelationPickerProps {
  label: string;
  helperText?: string;
  placeholder?: string;
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
  options: RelationOption[];
}

export function ContentRelationPicker({
  label,
  helperText,
  placeholder = "Search and select...",
  selectedSlugs,
  onChange,
  options,
}: ContentRelationPickerProps) {
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unselectedOptions = React.useMemo(() => {
    return options.filter((opt) => !selectedSlugs.includes(opt.slug));
  }, [options, selectedSlugs]);

  const filteredOptions = React.useMemo(() => {
    if (!query.trim()) return unselectedOptions.slice(0, 10);
    const q = query.toLowerCase().trim();
    return unselectedOptions
      .filter(
        (opt) =>
          opt.title.toLowerCase().includes(q) ||
          opt.slug.toLowerCase().includes(q) ||
          (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [unselectedOptions, query]);

  function handleSelect(slug: string) {
    onChange([...selectedSlugs, slug]);
    setQuery("");
  }

  function handleRemove(slug: string) {
    onChange(selectedSlugs.filter((s) => s !== slug));
  }

  const selectedItems = React.useMemo(() => {
    return selectedSlugs.map((slug) => {
      const match = options.find((o) => o.slug === slug);
      return (
        match || {
          slug,
          title: slug,
        }
      );
    });
  }, [selectedSlugs, options]);

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
          {label}
        </label>
        <span className="text-[11px] font-mono text-text-tertiary">
          {selectedSlugs.length} selected
        </span>
      </div>

      {helperText && (
        <p className="text-[11px] text-text-tertiary">{helperText}</p>
      )}

      {/* Selected Chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
          {selectedItems.map((item) => (
            <span
              key={item.slug}
              className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-primary/10 border border-primary/20 text-white text-xs font-mono"
            >
              <span className="font-medium truncate max-w-[14rem]">{item.title}</span>
              {item.badge && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-primary/20 text-primary">
                  {item.badge}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(item.slug)}
                className="text-text-tertiary hover:text-rose-400 transition-colors ml-0.5"
                title={`Remove ${item.title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search & Selector Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#141A29] border border-white/10 text-white placeholder-text-tertiary text-xs focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors font-mono"
          />
        </div>

        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-60 overflow-y-auto rounded-xl bg-[#0E131F] border border-white/15 shadow-2xl shadow-black/80 py-1 divide-y divide-white/5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs font-mono text-text-tertiary">
                {query.trim()
                  ? "No matching unselected items found."
                  : unselectedOptions.length === 0
                  ? "All available items already selected."
                  : "Type to search..."}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.slug}
                  type="button"
                  onClick={() => handleSelect(opt.slug)}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center justify-between gap-3 text-xs transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white group-hover:text-primary transition-colors truncate">
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-text-tertiary">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.subtitle && (
                      <p className="text-[11px] font-mono text-text-tertiary truncate mt-0.5">
                        {opt.subtitle}
                      </p>
                    )}
                  </div>
                  <Plus className="w-3.5 h-3.5 text-text-tertiary group-hover:text-primary flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
