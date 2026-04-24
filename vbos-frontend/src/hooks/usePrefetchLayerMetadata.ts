import { useEffect, useRef } from "react";
import API from "@/api";
import { useLayerStore } from "@/store/layer-store";
import { useAuthStore } from "@/store/auth-store";

/**
 * Prefetch dataset metadata for layers in the URL on initial load.
 * Ensures icon/color are correct when the page loads with layers (e.g. after refresh)
 * before the user has expanded the cluster in the sidebar.
 */
export function usePrefetchLayerMetadata() {
  const { layers, getLayerMetadata, setAllDatasets } = useLayerStore();
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!useAuthStore.getState().token) return;
    const layerIds = layers ? layers.split(",").map((l) => l.trim()).filter(Boolean) : [];
    if (layerIds.length === 0) return;

    const toFetch: { layerId: string; dataType: "vector" | "tabular" | "raster" | "pmtiles"; id: number }[] = [];

    for (const layerId of layerIds) {
      if (prefetchedRef.current.has(layerId)) continue;
      const metadata = getLayerMetadata(layerId);
      if (metadata) continue; // Already in store

      const prefix = layerId.slice(0, 1);
      const id = Number(layerId.slice(1));
      if (Number.isNaN(id)) continue;

      const typeMap = {
        v: "vector" as const,
        t: "tabular" as const,
        r: "raster" as const,
        p: "pmtiles" as const,
      };
      const dataType = typeMap[prefix as keyof typeof typeMap];
      if (dataType) toFetch.push({ layerId, dataType, id });
    }

    if (toFetch.length === 0) return;

    void Promise.all(
      toFetch.map(({ dataType, id }) =>
        API.getDatasetDetail(dataType, id).catch(() => null),
      ),
    ).then((results) => {
      const datasets = results.filter((d): d is NonNullable<typeof d> => d != null);
      if (datasets.length > 0) {
        setAllDatasets(datasets, { replace: false });
        toFetch.forEach(({ layerId }) => prefetchedRef.current.add(layerId));
      }
    });
  }, [layers, getLayerMetadata, setAllDatasets]);
}
