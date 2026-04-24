import { useEffect, useCallback } from "react";
import { useUiStore } from "@/store/ui-store";
import { useModeTransition } from "@/hooks/useModeTransition";

/**
 * Global keyboard shortcuts:
 * - Escape: Close panels (time series drawer, etc.)
 * - Alt+D: Hazard / thematic (disaster) context
 * - Alt+C: Climate module context
 * - Alt+X: Compare years context
 */
export function useKeyboardShortcuts() {
  const { isTimeSeriesOpen, setTimeSeriesOpen } = useUiStore();
  const { switchToMode } = useModeTransition();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        switchToMode("climate");
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        switchToMode("disaster");
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        switchToMode("compare");
        return;
      }
      // Escape: close open panels/drawers
      if (e.key === "Escape") {
        if (isTimeSeriesOpen) {
          setTimeSeriesOpen(false);
          e.preventDefault();
        }
      }
    },
    [isTimeSeriesOpen, setTimeSeriesOpen, switchToMode],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
