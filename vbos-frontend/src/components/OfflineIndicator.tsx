/**
 * Shows "Offline mode" when disconnected and optionally queued actions count.
 */
import { useEffect } from "react";
import { LuWifiOff } from "react-icons/lu";
import { useOfflineStore } from "@/store/offline-store";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline, queuedActions, setOnline } = useOfflineStore();

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Queued area drafts are synced by useOfflineAreaSync; it decrements queued as they sync
    };
    const handleOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  if (isOnline && queuedActions === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-[9998] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg",
        "border border-border bg-card",
        !isOnline && "text-amber-600 dark:text-amber-400",
      )}
      role="status"
      aria-live="polite"
    >
      {!isOnline && (
        <>
          <LuWifiOff className="size-4 shrink-0" />
          <span>Offline mode</span>
        </>
      )}
      {queuedActions > 0 && (
        <span className="text-muted-foreground">
          {queuedActions} action{queuedActions === 1 ? "" : "s"} queued
        </span>
      )}
    </div>
  );
}
