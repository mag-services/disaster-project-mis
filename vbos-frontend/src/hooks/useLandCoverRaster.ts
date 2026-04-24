/**
 * Finds the land cover raster dataset from baseline datasets across all clusters.
 * Used to auto-activate when entering Climate mode.
 * Prefers is_land_cover from API; falls back to name matching.
 */
import { useQuery, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import API from "@/api";
import { useAuthStore } from "@/store/auth-store";
import type { RasterDataset } from "@/types/api";

const LAND_COVER_NAMES = ["land cover", "land_cover", "landcover"];

function isLandCoverRaster(d: {
  name?: string;
  dataType: string;
  type?: string;
  is_land_cover?: boolean;
}): boolean {
  if (d.dataType !== "raster" || d.type !== "baseline") return false;
  if (d.is_land_cover === true) return true;
  const name = (d.name ?? "").toLowerCase();
  return LAND_COVER_NAMES.some((n) => name.includes(n));
}

export function useLandCoverRaster() {
  const isAuthenticated = !!useAuthStore((s) => s.token);

  const { data: clusters } = useQuery({
    queryKey: ["clusters"],
    queryFn: () => API.getClusters(),
    staleTime: 60 * 1000,
    enabled: isAuthenticated,
  });

  const clusterNames = useMemo(
    () => clusters?.map((c) => c.name) ?? [],
    [clusters],
  );

  const results = useQueries({
    queries: clusterNames.map((name) => ({
      queryKey: ["datasets", name, "climate"] as const,
      queryFn: () => API.getDatasets(name, "climate"),
      staleTime: 60 * 1000,
      enabled: isAuthenticated,
    })),
  });

  return useMemo(() => {
    for (const r of results) {
      if (!r.data) continue;
      for (const group of r.data) {
        if (group.type !== "baseline") continue;
        const found = group.datasets.find((d) =>
          isLandCoverRaster(d as { name?: string; dataType: string; type?: string }),
        );
        if (found) {
          return {
            layerId: `r${found.id}`,
            dataset: found as RasterDataset,
          };
        }
      }
    }
    return null;
  }, [results]);
}
