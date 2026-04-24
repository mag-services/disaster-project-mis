import { useQuery } from "@tanstack/react-query";
import API from "@/api";
import { useLayerStore } from "@/store/layer-store";
import { useViewStore } from "@/store/view-store";
import { useEffect } from "react";

function useClusters() {
  const { isPending, error, data } = useQuery({
    queryKey: ["clusters"],
    queryFn: () => API.getClusters(),
    staleTime: 0, // Always refetch so new clusters show after admin changes
  });

  return {
    isPending,
    error,
    data,
  };
}

function useClusterDatasets(
  cluster: string,
  options?: { enabled?: boolean; replace?: boolean },
) {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const scenario =
    scenarioId === "climate"
      ? "climate"
      : scenarioId === "disaster" || scenarioId === "compare"
        ? "disaster"
        : undefined;
  const { setAllDatasets } = useLayerStore();
  const { isPending, error, data } = useQuery({
    queryKey: ["datasets", cluster, scenario],
    queryFn: () => API.getDatasets(cluster, scenario),
    enabled: options?.enabled ?? true,
  });

  useEffect(() => {
    if (data) {
      const datasets = data.flatMap((t) => t.datasets);
      setAllDatasets(datasets, { replace: options?.replace !== false });
    }
  }, [data, setAllDatasets, options?.replace]);

  return {
    isPending,
    error,
    data,
  };
}

export { useClusters, useClusterDatasets };
