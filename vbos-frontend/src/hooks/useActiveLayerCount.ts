import { useMemo } from "react";
import { useLayerStore } from "@/store/layer-store";
import { Dataset } from "@/types/api";

/**
 * Hook to count how many active layers belong to a given set of datasets.
 *
 * @param datasets - Array of datasets to check against active layers
 * @returns number containing count of active layers
 *
 * @example
 * // For a cluster with multiple datasets
 * const count = useActiveLayerCount(allDatasetsInCluster);
 *
 * @example
 * // For a dataset section
 * const count = useActiveLayerCount(datasetsInSection);
 */
export function useActiveLayerCount(datasets: Dataset[] | undefined) {
  const { layers } = useLayerStore();

  const result = useMemo(() => {
    if (!datasets || datasets.length === 0) {
      return 0;
    }
    const layersIds = layers ? layers.split(",").filter(Boolean) : [];
    const activeLayerIds = datasets
      .map((i) => `${i.dataType.slice(0, 1)}${i.id}`)
      .filter((i) => layersIds.includes(i));

    return activeLayerIds.length;
  }, [datasets, layers]);

  return result;
}
