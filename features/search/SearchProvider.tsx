"use client";

/**
 * features/search/SearchProvider.tsx
 * ────────────────────────────────────────────────────────────────
 * Context provider that manages the global search modal state.
 * Wrap the root layout to enable Cmd/Ctrl+K from anywhere.
 */

import * as React from "react";
import { GlobalSearchModal, useGlobalSearchShortcut } from "./GlobalSearchModal";

interface SearchContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const SearchContext = React.createContext<SearchContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function useSearch() {
  return React.useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);

  useGlobalSearchShortcut(open);

  return (
    <SearchContext.Provider value={{ isOpen, open, close }}>
      {children}
      <GlobalSearchModal isOpen={isOpen} onClose={close} />
    </SearchContext.Provider>
  );
}
