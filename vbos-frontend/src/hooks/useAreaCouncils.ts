import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { FeatureCollection } from "geojson";
import API from "@/api";

function useAreaCouncils(provinces: string[]) {
  const queries = useQueries({
    queries: provinces.map((province) => ({
      queryKey: ["area-councils", province],
      queryFn: () => API.getAreaCouncils(province),
      enabled: !!province,
    })),
  });

  const isPending = queries.some((q) => q.isPending);
  const error = queries.find((q) => q.error)?.error;
  const data = useMemo(() => {
    const features = queries.flatMap((q) => q.data?.features ?? []);
    if (features.length === 0) return undefined;
    return { type: "FeatureCollection" as const, features } satisfies FeatureCollection;
  }, [
    queries.map((q) => q.dataUpdatedAt ?? 0).join(","),
    queries.map((q) => q.data?.features?.length ?? 0).join(","),
  ]);

  return {
    isPending,
    error,
    data,
  };
}

export default useAreaCouncils;
