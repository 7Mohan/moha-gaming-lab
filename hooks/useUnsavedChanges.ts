"use client";

import * as React from "react";

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  message?: string;
}

export function useUnsavedChanges({
  isDirty,
  message = "You have unsaved changes. Leave without saving?",
}: UseUnsavedChangesOptions) {
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<(() => void) | null>(null);

  // Intercept browser window close or reload
  React.useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = message;
      return message;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);

  // Intercept click on internal links
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!isDirty) return;

      const target = (e.target as HTMLElement).closest("a");
      if (!target || !target.href) return;

      // Ignore links that open in new tab
      if (target.target === "_blank") return;

      const url = new URL(target.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
        e.preventDefault();
        e.stopPropagation();
        setPendingNavigation(() => () => {
          window.location.href = target.href;
        });
        setShowPrompt(true);
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty]);

  function confirmLeave() {
    setShowPrompt(false);
    if (pendingNavigation) {
      pendingNavigation();
    }
  }

  function stay() {
    setShowPrompt(false);
    setPendingNavigation(null);
  }

  return {
    showPrompt,
    confirmLeave,
    stay,
  };
}
