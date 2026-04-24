import { useEffect } from "react";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";
import { useDateStore } from "@/store/date-store";
import { useMapStore } from "@/store/map-store";
import { useComparisonStore } from "@/store/comparison-store";
import { useViewStore } from "@/store/view-store";

export const useUrlSync = () => {
  const { syncFromUrl: syncAreaFromUrl } = useAreaStore();
  const { syncFromUrl: syncDateFromUrl } = useDateStore();
  const { syncFromUrl: syncLayersFromUrl } = useLayerStore();
  const { syncFromUrl: syncMapFromUrl } = useMapStore();
  const { syncFromUrl: syncComparisonFromUrl } = useComparisonStore();
  const { syncFromUrl: syncViewFromUrl } = useViewStore();

  useEffect(() => {
    const syncCompareDeepLink = () => {
      const sid = useViewStore.getState().scenarioId;
      const params = new URLSearchParams(window.location.search);
      if (sid === "compare" && params.get("compare") !== "1") {
        useComparisonStore.getState().setComparisonMode(true);
      }
    };

    // Sync from URL on mount and on popstate (shareable links restore full view state)
    syncAreaFromUrl();
    syncDateFromUrl();
    syncLayersFromUrl();
    syncMapFromUrl();
    syncViewFromUrl();
    syncComparisonFromUrl();
    syncCompareDeepLink();

    const handlePopState = () => {
      syncAreaFromUrl();
      syncDateFromUrl();
      syncLayersFromUrl();
      syncMapFromUrl();
      syncViewFromUrl();
      syncComparisonFromUrl();
      syncCompareDeepLink();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [syncAreaFromUrl, syncLayersFromUrl, syncDateFromUrl, syncMapFromUrl, syncViewFromUrl, syncComparisonFromUrl]);
};
