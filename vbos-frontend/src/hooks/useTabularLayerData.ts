import { useQuery } from "@tanstack/react-query";
import API from "@/api";
import type { TabularData } from "@/types/api";
import { useAreaStore } from "@/store/area-store";
import { useDateStore } from "@/store/date-store";

/**
 * Fetches tabular data via the aggregate endpoint for choropleths.
 * Returns a small payload (one row per province/area_council) instead of all raw rows.
 */
export function useTabularLayerData(id: number) {
  const { year } = useDateStore();
  const { ac, province } = useAreaStore();

  const groupBy = province && ac ? "area_council" : "province";

  const { isPending, error, data } = useQuery({
    queryKey: ["tabular-aggregate", id, year, groupBy, province ?? ""],
    queryFn: () =>
      API.getTabularAggregate(id, {
        group_by: groupBy,
        year,
        agg: "sum",
        ...(groupBy === "area_council" && province ? { province } : {}),
      }),
    staleTime: 10 * 60 * 1000,
  });

  // Transform to TabularData[] for compatibility with useAdminAreaStats / getValue
  const results: TabularData[] =
    data?.results?.map((r) => {
      const base = {
        id: 0,
        attribute: (r as { attribute?: string }).attribute ?? "",
        date: `${year}-01-01`,
        value: (r as { value?: number }).value ?? 0,
      };
      if (groupBy === "province") {
        return { ...base, province: (r as { province?: string }).province };
      }
      return { ...base, area_council: (r as { area_council?: string }).area_council };
    }) ?? [];

  return { data: { results }, isPending, error, results };
}
