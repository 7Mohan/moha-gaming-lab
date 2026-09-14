import * as React from "react";
import { Suspense } from "react";
import { buildMetadata } from "@/lib/metadata";
import { SearchPageClient } from "@/features/search/SearchPageClient";

export const metadata = buildMetadata({
  title: "Search",
  description:
    "Search across Moha Gaming Lab — discover games, browser diagnostics, Android apps, and technical guides in one unified discovery experience.",
  path: "/search",
  noIndex: true,
});

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container-content" style={{ paddingTop: "2.5rem" }}>
          <div
            style={{
              height: 40,
              width: 200,
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-elevated)",
              marginBottom: 16,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              height: 52,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              maxWidth: 700,
            }}
          />
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
