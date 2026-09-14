"use client";

import * as React from "react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export interface BulkAction<T> {
  label: string;
  variant?: "danger" | "default" | "primary";
  action: (selectedRows: T[]) => void | Promise<void>;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  bulkActions?: BulkAction<T>[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  initialSortKey?: string;
  initialSortDir?: "asc" | "desc";
  pageSize?: number;
}

export function AdminTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = "Search records...",
  searchFilter,
  bulkActions = [],
  emptyTitle = "No records found",
  emptyDescription = "Get started by adding your first record.",
  emptyAction,
  initialSortKey,
  initialSortDir = "asc",
  pageSize = 10,
}: AdminTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | undefined>(initialSortKey);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">(initialSortDir);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isBulkPending, setIsBulkPending] = React.useState(false);

  // 1. Filter
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, searchQuery.toLowerCase().trim()));
  }, [data, searchQuery, searchFilter]);

  // 2. Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const res = aVal < bVal ? -1 : 1;
      return sortDir === "asc" ? res : -res;
    });
  }, [filteredData, sortKey, sortDir]);

  // 3. Paginate
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Checkbox helpers
  const allPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedKeys.has(rowKey(row)));

  function toggleSelectAll() {
    const next = new Set(selectedKeys);
    if (allPageSelected) {
      paginatedData.forEach((row) => next.delete(rowKey(row)));
    } else {
      paginatedData.forEach((row) => next.add(rowKey(row)));
    }
    setSelectedKeys(next);
  }

  function toggleRow(key: string) {
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedKeys(next);
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function executeBulk(action: BulkAction<T>) {
    const selectedRows = data.filter((row) => selectedKeys.has(rowKey(row)));
    if (selectedRows.length === 0) return;
    setIsBulkPending(true);
    try {
      await action.action(selectedRows);
      setSelectedKeys(new Set());
    } finally {
      setIsBulkPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0E131F] p-3 rounded-2xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-[#141A29] border border-white/10 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Bulk Action Controls */}
        {selectedKeys.size > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <span className="text-xs font-mono text-primary font-semibold">
              {selectedKeys.size} selected
            </span>
            {bulkActions.map((ba) => (
              <button
                key={ba.label}
                type="button"
                disabled={isBulkPending}
                onClick={() => executeBulk(ba)}
                className={`py-1 px-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                  ba.variant === "danger"
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                    : "bg-white/10 text-white border border-white/15 hover:bg-white/15"
                }`}
              >
                {ba.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedKeys(new Set())}
              className="text-xs text-text-tertiary hover:text-white underline ml-1"
            >
              Clear
            </button>
          </div>
        )}

        {/* Count summary */}
        <div className="text-xs font-mono text-text-tertiary self-center hidden lg:block">
          Showing {paginatedData.length} of {sortedData.length} records
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#0E131F] rounded-2xl border border-white/10 overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                {bulkActions.length > 0 && (
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      className="rounded bg-[#141A29] border-white/20 text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-3 px-4 font-semibold ${col.className || ""} ${
                      col.sortable ? "cursor-pointer select-none hover:text-white" : ""
                    }`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && sortKey === col.key && (
                        <span className="text-primary font-sans font-bold">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-text-secondary">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                    className="py-12 px-4 text-center"
                  >
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-text-tertiary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{emptyTitle}</h4>
                        <p className="text-xs text-text-tertiary mt-1">{emptyDescription}</p>
                      </div>
                      {emptyAction && <div className="pt-2">{emptyAction}</div>}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const key = rowKey(row);
                  const isSelected = selectedKeys.has(key);

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        isSelected ? "bg-primary/[0.04]" : ""
                      }`}
                    >
                      {bulkActions.length > 0 && (
                        <td className="py-3 px-4 w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(key)}
                            className="rounded bg-[#141A29] border-white/20 text-primary focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className={`py-3 px-4 ${col.className || ""}`}>
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-text-tertiary font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-text-secondary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-text-secondary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
