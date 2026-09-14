"use client";

import * as React from "react";
import type { TocItem } from "@/lib/guides";
import { ListTree, ChevronDown, ChevronUp } from "lucide-react";

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [isOpenMobile, setIsOpenMobile] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0% -60% 0%" }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="p-4 sm:p-5 rounded-lg border border-border-default bg-bg-surface flex flex-col gap-3"
    >
      {/* Header / Mobile Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
          <ListTree size={14} className="text-accent" aria-hidden="true" />
          <span>Table of Contents</span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpenMobile((prev) => !prev)}
          className="sm:hidden p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
          aria-expanded={isOpenMobile}
          aria-label="Toggle table of contents"
        >
          {isOpenMobile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Nav List */}
      <ul
        className={`flex flex-col gap-1.5 text-xs font-mono transition-all ${
          isOpenMobile ? "block" : "hidden sm:flex"
        }`}
      >
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li
              key={item.id}
              className={`${item.level === "h3" ? "pl-3.5 border-l border-border-subtle" : ""}`}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(item.id);
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                    setActiveId(item.id);
                    setIsOpenMobile(false);
                  }
                }}
                className={`block py-1 leading-snug transition-colors truncate ${
                  isActive
                    ? "text-accent font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
