/**
 * Hook for syncing offline area drafts when connection is restored.
 * Triggers sync on online event and when component mounts (if online).
 */
import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { syncOfflineDrafts } from "@/api/areaSubmissions";
import { getOfflineDrafts } from "@/lib/offlineStorage";
import { useOfflineStore } from "@/store/offline-store";
import { toast } from "@/utils/toast";

export function useOfflineAreaSync() {
  const queryClient = useQueryClient();
  const isOnline = useOfflineStore((s) => s.isOnline);
  const queuedActions = useOfflineStore((s) => s.queuedActions);
  const decrementQueued = useOfflineStore((s) => s.decrementQueued);
  const setQueued = useOfflineStore((s) => s.setQueued);

  useEffect(() => {
    getOfflineDrafts().then((drafts) => {
      if (drafts.length > 0) setQueued(drafts.length);
    });
  }, [setQueued]);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const synced = await syncOfflineDrafts();
      if (synced > 0) {
        for (let i = 0; i < synced; i++) decrementQueued();
        queryClient.invalidateQueries({ queryKey: ["area-submissions"] });
        toast.success("Drafts synced", `${synced} draft(s) saved to server.`);
      }
    } catch {
      // Sync failed, keep drafts for next attempt
    }
  }, [queryClient, decrementQueued]);

  useEffect(() => {
    if (!isOnline || queuedActions === 0) return;
    runSync();
  }, [isOnline, queuedActions, runSync]);

  useEffect(() => {
    const handleOnline = () => {
      useOfflineStore.getState().setOnline(true);
      runSync();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [runSync]);
}
