"use client";

/**
 * features/search/SearchResultCard.tsx
 * ────────────────────────────────────────────────────────────────
 * Unified search result card for all content types.
 * Renders identically for Games, Tools, Apps, and Guides.
 * Supports compact (modal) and expanded (page) display modes.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SearchResult, SearchResultType } from "@/types/search";
import { SECTION_COLORS } from "@/lib/search";

/* ── Section icon (inline SVG, no external icon dependency) ── */

function SectionIcon({ type, color }: { type: SearchResultType; color: string }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    "aria-hidden": true,
  };

  switch (type) {
    case "game":
      return (
        <svg {...props}>
          <path d="M6 12h4m-2-2v4M15 12h.01M18 12h.01" strokeLinecap="round" />
          <rect x="2" y="7" width="20" height="14" rx="3" />
        </svg>
      );
    case "tool":
      return (
        <svg {...props}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "app":
      return (
        <svg {...props}>
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" strokeWidth={2.5} />
        </svg>
      );
    case "guide":
      return (
        <svg {...props}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
  }
}

/* ── Badge ───────────────────────────────────────────────────── */

function ResultBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 5px",
        fontSize: "9px",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderRadius: "var(--radius-xs)",
        border: "1px solid var(--border-default)",
        color: "var(--text-muted)",
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

/* ── Highlight query matches in text ──────────────────────────── */

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              background: "rgba(0, 229, 160, 0.20)",
              color: "#00E5A0",
              borderRadius: "2px",
              padding: "0 1px",
            }}
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

/* ── Main Card ────────────────────────────────────────────────── */

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  compact?: boolean;  // true = modal mode, false = page mode
  isActive?: boolean; // keyboard focus for modal
  onClick?: () => void;
}

export function SearchResultCard({
  result,
  query,
  compact = false,
  isActive = false,
  onClick,
}: SearchResultCardProps) {
  const color = SECTION_COLORS[result.type] ?? "#00E5A0";

  return (
    <Link
      href={result.href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: compact ? "10px" : "12px",
        padding: compact ? "10px 12px" : "12px 16px",
        borderRadius: "var(--radius-md)",
        background: isActive
          ? "var(--bg-elevated)"
          : "transparent",
        border: "1px solid",
        borderColor: isActive
          ? "var(--border-strong)"
          : "transparent",
        textDecoration: "none",
        transition: "background var(--transition-fast), border-color var(--transition-fast)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.borderColor = "transparent";
        }
      }}
    >
      {/* Type icon */}
      <div
        style={{
          flexShrink: 0,
          marginTop: "2px",
          width: compact ? 24 : 28,
          height: compact ? 24 : 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-sm)",
          background: `${color}15`,
          border: `1px solid ${color}25`,
        }}
      >
        <SectionIcon type={result.type} color={color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: compact ? "13px" : "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.35,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Highlight text={result.title} query={query} />
          </span>
          {!compact && (
            <ArrowRight
              size={13}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: color,
            marginBottom: compact ? 2 : 4,
            letterSpacing: "0.02em",
          }}
        >
          {result.subtitle}
        </div>

        {/* Excerpt */}
        {!compact && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              margin: "0 0 6px 0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <Highlight text={result.excerpt} query={query} />
          </p>
        )}

        {/* Badges */}
        {result.badges && result.badges.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginTop: compact ? 0 : 2,
            }}
          >
            {result.badges.map((badge) => (
              <ResultBadge key={badge} label={badge} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
